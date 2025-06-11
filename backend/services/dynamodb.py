import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from config import settings
from typing import Dict, List, Optional
import logging

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
        """Create DynamoDB table with proper schema"""
        try:
            table = self.dynamodb.create_table(
                TableName=self.table_name,
                KeySchema=[
                    {
                        'AttributeName': 'userEmail',
                        'KeyType': 'HASH'  # Partition key
                    },
                    {
                        'AttributeName': 'projectId',
                        'KeyType': 'RANGE'  # Sort key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'userEmail',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'projectId',
                        'AttributeType': 'S'
                    }
                ],
                BillingMode='PAY_PER_REQUEST'  # On-demand pricing
            )
            
            # Wait for table to be created
            table.meta.client.get_waiter('table_exists').wait(TableName=self.table_name)
            logger.info(f"Table {self.table_name} created successfully")
            
            self.table = table
            
        except ClientError as e:
            logger.error(f"Error creating DynamoDB table: {e}")
            raise

    def create_project(self, user_email: str, project_id: str, project_name: str, project_type: str) -> Dict:
        """Create a new project"""
        try:
            from datetime import datetime
            
            item = {
                'userEmail': user_email,
                'projectId': project_id,
                'projectName': project_name,
                'projectType': project_type,  # 'beginner' or 'expert'
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            # Use condition to prevent overwriting existing project
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(projectId)'
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
            response = self.table.query(
                KeyConditionExpression=Key('userEmail').eq(user_email),
                ScanIndexForward=False  # Sort by sort key in descending order (newest first)
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
                    'userEmail': user_email,
                    'projectId': project_id
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

    def update_project(self, user_email: str, project_id: str, updates: Dict) -> Dict:
        """Update a project"""
        try:
            from datetime import datetime
            
            # Build update expression dynamically
            update_expression = "SET updatedAt = :updatedAt"
            expression_values = {":updatedAt": datetime.utcnow().isoformat()}
            
            for key, value in updates.items():
                if key not in ['userEmail', 'projectId']:  # Don't update keys
                    update_expression += f", {key} = :{key}"
                    expression_values[f":{key}"] = value
            
            response = self.table.update_item(
                Key={
                    'userEmail': user_email,
                    'projectId': project_id
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW"
            )
            
            return {
                "success": True,
                "project": response['Attributes']
            }
            
        except ClientError as e:
            logger.error(f"Error updating project {project_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to update project: {str(e)}"
            }

    def delete_project(self, user_email: str, project_id: str) -> Dict:
        """Delete a project"""
        try:
            self.table.delete_item(
                Key={
                    'userEmail': user_email,
                    'projectId': project_id
                },
                ConditionExpression='attribute_exists(projectId)'
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

# Global instance
dynamodb_service = DynamoDBService()