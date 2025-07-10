import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from config import settings
from typing import Dict, List, Optional, Any
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class DynamoDBService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.table_name = settings.dynamodb_table_name
        self.table = None
        self._initialize_table()

    def _initialize_table(self):
        """Initialize table connection and create if doesn't exist"""
        try:
            self.table = self.dynamodb.Table(self.table_name)
            # Test if table exists by describing it
            self.table.meta.client.describe_table(TableName=self.table_name)
            logger.info(f"Connected to existing table: {self.table_name}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                logger.info(f"Table {self.table_name} not found. Creating...")
                self._create_table()
            else:
                logger.error(f"Error connecting to DynamoDB table: {e}")
                raise

    def _create_table(self):
        """Create DynamoDB table with proper schema for projects and Q&A"""
        try:
            table = self.dynamodb.create_table(
                TableName=self.table_name,
                KeySchema=[
                    {
                        'AttributeName': 'PK',  # Partition key: userEmail#projectId or userEmail#QUESTIONS
                        'KeyType': 'HASH'
                    },
                    {
                        'AttributeName': 'SK',  # Sort key: PROJECT or TASK#{taskIndex}#SUBTASK#{subtaskIndex}
                        'KeyType': 'RANGE'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'PK',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'SK',
                        'AttributeType': 'S'
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Wait for table to be created
            table.meta.client.get_waiter('table_exists').wait(TableName=self.table_name)
            logger.info(f"Table {self.table_name} created successfully")
            
            self.table = table
            
        except ClientError as e:
            logger.error(f"Error creating DynamoDB table: {e}")
            raise

    # ========== PROJECT OPERATIONS ==========
    
    def create_project(self, user_email: str, project_id: str, project_name: str, project_type: str) -> Dict:
        """Create a new project with empty LLM context"""
        try:
            item = {
                'PK': f"{user_email}#{project_id}",
                'SK': 'PROJECT',
                'userEmail': user_email,
                'projectId': project_id,
                'projectName': project_name,
                'projectType': project_type,
                'context_for_LLM': '',  # Initialize empty context
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'itemType': 'PROJECT'
            }
            
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(PK)'
            )
            
            logger.info(f"Project created: {project_id} for user: {user_email}")
            return {
                "success": True,
                "project": item
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return {
                    "success": False,
                    "message": "Project with this ID already exists"
                }
            logger.error(f"Error creating project: {e}")
            return {
                "success": False,
                "message": f"Failed to create project: {str(e)}"
            }

    def get_user_projects(self, user_email: str) -> Dict:
        """Get all projects for a user"""
        try:
            # Use scan with filter expression to find all user projects
            response = self.table.scan(
                FilterExpression=Attr('userEmail').eq(user_email) & Attr('itemType').eq('PROJECT')
            )
            
            projects = response.get('Items', [])
            
            logger.info(f"Retrieved {len(projects)} projects for user: {user_email}")
            
            return {
                "success": True,
                "projects": projects
            }
            
        except ClientError as e:
            logger.error(f"Error retrieving projects for user {user_email}: {e}")
            return {
                "success": False,
                "message": f"Failed to retrieve projects: {str(e)}"
            }

    def get_project(self, user_email: str, project_id: str) -> Dict:
        """Get a specific project"""
        try:
            response = self.table.get_item(
                Key={
                    'PK': f"{user_email}#{project_id}",
                    'SK': 'PROJECT'
                }
            )
            
            if 'Item' not in response:
                return {
                    "success": False,
                    "message": "Project not found"
                }
            
            return {
                "success": True,
                "project": response['Item']
            }
            
        except ClientError as e:
            logger.error(f"Error retrieving project {project_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to retrieve project: {str(e)}"
            }

    def update_project_context(self, user_email: str, project_id: str, new_context: str) -> Dict:
        """Update the LLM context for a project"""
        try:
            response = self.table.update_item(
                Key={
                    'PK': f"{user_email}#{project_id}",
                    'SK': 'PROJECT'
                },
                UpdateExpression="SET context_for_LLM = :context, updatedAt = :updatedAt",
                ExpressionAttributeValues={
                    ":context": new_context,
                    ":updatedAt": datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
            
            return {
                "success": True,
                "project": response['Attributes']
            }
            
        except ClientError as e:
            logger.error(f"Error updating project context {project_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to update project context: {str(e)}"
            }

    def delete_project(self, user_email: str, project_id: str) -> Dict:
        """Delete a project and all its associated Q&A data"""
        try:
            # First delete all Q&A data for this project
            self._delete_project_qa_data(user_email, project_id)
            
            # Then delete the project itself
            self.table.delete_item(
                Key={
                    'PK': f"{user_email}#{project_id}",
                    'SK': 'PROJECT'
                },
                ConditionExpression='attribute_exists(PK)'
            )
            
            return {
                "success": True,
                "message": "Project deleted successfully"
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return {
                    "success": False,
                    "message": "Project not found"
                }
            logger.error(f"Error deleting project {project_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to delete project: {str(e)}"
            }

    # ========== QUESTION & ANSWER OPERATIONS ==========
    
    def save_question_answer(self, user_email: str, project_id: str, task_index: int, 
                           subtask_index: int, question_id: str, question_text: str,
                           question_type: str, user_response: Optional[str] = None,
                           options: Optional[List[str]] = None, file_url: Optional[str] = None,
                           file_name: Optional[str] = None) -> Dict:
        """Save a question and its answer"""
        try:
            item = {
                'PK': f"{user_email}#{project_id}",
                'SK': f"TASK#{task_index}#SUBTASK#{subtask_index}",
                'questionId': question_id,
                'taskIndex': task_index,
                'subtaskIndex': subtask_index,
                'questionText': question_text,
                'questionType': question_type,
                'userResponse': user_response,
                'options': options,
                'fileUrl': file_url,
                'fileName': file_name,
                'answeredAt': datetime.utcnow().isoformat(),
                'itemType': 'QUESTION_ANSWER'
            }
            
            # Remove None values
            item = {k: v for k, v in item.items() if v is not None}
            
            self.table.put_item(Item=item)
            
            logger.info(f"Q&A saved for project {project_id}, task {task_index}, subtask {subtask_index}")
            return {
                "success": True,
                "data": item
            }
            
        except ClientError as e:
            logger.error(f"Error saving Q&A: {e}")
            return {
                "success": False,
                "message": f"Failed to save question/answer: {str(e)}"
            }

    def get_project_answers(self, user_email: str, project_id: str) -> Dict:
        """Get all answers for a project"""
        try:
            response = self.table.query(
                KeyConditionExpression=Key('PK').eq(f"{user_email}#{project_id}") & Key('SK').begins_with('TASK#'),
                ScanIndexForward=True
            )
            
            answers = []
            for item in response.get('Items', []):
                if item.get('itemType') == 'QUESTION_ANSWER':
                    answers.append(item)
            
            logger.info(f"Retrieved {len(answers)} answers for project {project_id}")
            
            return {
                "success": True,
                "answers": answers
            }
            
        except ClientError as e:
            logger.error(f"Error retrieving answers for project {project_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to retrieve answers: {str(e)}"
            }

    def get_specific_answer(self, user_email: str, project_id: str, task_index: int, subtask_index: int) -> Dict:
        """Get a specific answer"""
        try:
            response = self.table.get_item(
                Key={
                    'PK': f"{user_email}#{project_id}",
                    'SK': f"TASK#{task_index}#SUBTASK#{subtask_index}"
                }
            )
            
            if 'Item' not in response:
                return {
                    "success": False,
                    "message": "Answer not found"
                }
            
            return {
                "success": True,
                "answer": response['Item']
            }
            
        except ClientError as e:
            logger.error(f"Error retrieving specific answer: {e}")
            return {
                "success": False,
                "message": f"Failed to retrieve answer: {str(e)}"
            }

    def _delete_project_qa_data(self, user_email: str, project_id: str):
        """Helper method to delete all Q&A data for a project"""
        try:
            # Query all Q&A items for this project
            response = self.table.query(
                KeyConditionExpression=Key('PK').eq(f"{user_email}#{project_id}") & Key('SK').begins_with('TASK#')
            )
            
            # Delete each item
            with self.table.batch_writer() as batch:
                for item in response.get('Items', []):
                    batch.delete_item(
                        Key={
                            'PK': item['PK'],
                            'SK': item['SK']
                        }
                    )
            
            logger.info(f"Deleted Q&A data for project {project_id}")
            
        except ClientError as e:
            logger.error(f"Error deleting Q&A data for project {project_id}: {e}")

# Global instance
dynamodb_service = DynamoDBService()