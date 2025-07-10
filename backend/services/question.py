from nanoid import generate
from services.dynamodb import dynamodb_service
from services.openai import openai_service
from services.s3 import s3_service
from models import (
    QuestionResponse, AnswerResponse, QuestionType, 
    AIQuestionGenerationResponse, DatasetSummaryResponse
)
from typing import Dict, List, Any, Optional
import logging
import json
import io
import copy
import pandas as pd

logger = logging.getLogger(__name__)

class QuestionService:
    def __init__(self):
        self.db = dynamodb_service
        self.ai = openai_service
        self.s3 = s3_service

    def generate_question_id(self) -> str:
        """Generate a unique question ID"""
        return generate(size=16)

    def get_or_generate_question(self, user_email: str, project_id: str, 
                               task_index: int, subtask_index: int) -> Dict:
        """Get existing question or generate new one"""
        try:
            # First check if question already exists
            existing_answer = self.db.get_specific_answer(user_email, project_id, task_index, subtask_index)
            
            if existing_answer["success"]:
                # Question already answered, return the stored question
                answer_data = existing_answer["answer"]
                return {
                    "success": True,
                    "question": QuestionResponse(
                        questionId=answer_data.get("questionId", ""),
                        taskIndex=task_index,
                        subtaskIndex=subtask_index,
                        questionType=QuestionType(answer_data.get("questionType", "text")),
                        questionText=answer_data.get("questionText", ""),
                        options=answer_data.get("options"),
                        isRequired=True
                    ),
                    "existingAnswer": AnswerResponse(
                        userEmail=user_email,
                        projectId=project_id,
                        taskIndex=task_index,
                        subtaskIndex=subtask_index,
                        questionId=answer_data.get("questionId", ""),
                        answerType=QuestionType(answer_data.get("questionType", "text")),
                        textAnswer=answer_data.get("userResponse"),
                        selectedOption=answer_data.get("userResponse") if answer_data.get("questionType") == "radio" else None,
                        fileName=answer_data.get("fileName"),
                        fileUrl=answer_data.get("fileUrl"),
                        answeredAt=answer_data.get("answeredAt", "")
                    )
                }

            # No existing answer, generate new question
            return self._generate_new_question(user_email, project_id, task_index, subtask_index)

        except Exception as e:
            logger.error(f"Error getting/generating question: {e}")
            return {
                "success": False,
                "message": f"Failed to get question: {str(e)}"
            }

    def _generate_new_question(self, user_email: str, project_id: str, 
                             task_index: int, subtask_index: int) -> Dict:
        """Generate a new question based on context"""
        try:
            # Get project details
            project_result = self.db.get_project(user_email, project_id)
            if not project_result["success"]:
                return project_result

            project = project_result["project"]
            project_name = project.get("projectName", "")
            project_type = project.get("projectType", "beginner")
            context = project.get("context_for_LLM", "")

            question_id = self.generate_question_id()

            # Handle specific task/subtask combinations
            if task_index == 1 and subtask_index == 0:
                # Task 1: Project idea question
                ai_response = self.ai.generate_task1_question(project_name, project_type)
                
                if not ai_response.success:
                    return {"success": False, "message": ai_response.error}

                return {
                    "success": True,
                    "question": QuestionResponse(
                        questionId=question_id,
                        taskIndex=task_index,
                        subtaskIndex=subtask_index,
                        questionType=QuestionType.TEXT,
                        questionText=ai_response.question,
                        isRequired=True
                    )
                }

            elif task_index == 2:
                if subtask_index == 0:
                    # Task 2, Subtask 1: CSV Upload
                    ai_response = self.ai.generate_dynamic_question(
                        context, project_name, project_type, task_index, subtask_index + 1
                    )
                    
                    if not ai_response.success:
                        return {"success": False, "message": ai_response.error}

                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=task_index,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.FILE,
                            questionText=ai_response.question,
                            fileTypes=[".csv"],
                            maxFileSize=5 * 1024 * 1024,  # 5MB
                            isRequired=True
                        )
                    }

                elif subtask_index == 1:
                    # Task 2, Subtask 2: Dataset summary
                    csv_answer = self.db.get_specific_answer(user_email, project_id, task_index, 0)
                    file_key = csv_answer["answer"].get("fileUrl", "")
                    summary = self.s3.get_dataset_summary(file_key)
                    if not summary:
                        return {"success": False, "message": "Failed to generate dataset summary"}
                    summary_text = self._format_dataset_summary(summary)
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=task_index,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.READONLY,
                            questionText=f"Review Dataset Summary:\n\n{summary_text}\n\nClick submit when you're ready to proceed to the next step.",
                            isRequired=False
                        ),
                        "datasetSummary": summary
                    }

                elif subtask_index == 2:
                    # Task 2, Subtask 3: Target column selection
                    # Need CSV data from previous step
                    csv_answer = self.db.get_specific_answer(user_email, project_id, task_index, 0)
                    file_key = csv_answer["answer"].get("fileUrl", "")
                    if not file_key:
                        return {"success": False, "message": "CSV file not found"}
                    # Get CSV data and generate target columns (file_key is already the S3 key)
                    is_valid, message, csv_data = self.s3.validate_and_process_csv(file_key)
                    if not is_valid:
                        return {"success": False, "message": message}
                    ai_response = self.ai.generate_target_columns(csv_data, context)
                    if not ai_response.success:
                        return {"success": False, "message": ai_response.error}
                    # Combine regression and classification columns
                    all_columns = ai_response.regressionColumns + ai_response.classificationColumns
                    if not all_columns:
                        return {"success": False, "message": "No suitable target columns found in the dataset"}
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=task_index,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.RADIO,
                            questionText="Choose the column you want to predict:",
                            options=all_columns,
                            isRequired=True
                        )
                    }

                elif subtask_index == 3:
                    # Task 2, Subtask 4: Problem type confirmation
                    # Get target column from previous step
                    target_answer = self.db.get_specific_answer(user_email, project_id, task_index, subtask_index - 1)
                    if not target_answer["success"]:
                        return {"success": False, "message": "Target column selection required"}
                    target_column = target_answer["answer"].get("userResponse", "")
                    # Get CSV data
                    csv_answer = self.db.get_specific_answer(user_email, project_id, task_index, 0)
                    file_key = csv_answer["answer"].get("fileUrl", "")
                    _, _, csv_data = self.s3.validate_and_process_csv(file_key)
                    # Detect problem type
                    ai_response = self.ai.detect_problem_type(target_column, csv_data, context)
                    if not ai_response.success:
                        return {"success": False, "message": ai_response.error}
                    confirmation_text = f"Confirm problem type: This is a {ai_response.problemType} problem. {ai_response.explanation} Click submit to proceed to the next step."
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=task_index,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.READONLY,
                            questionText=confirmation_text,
                            isRequired=False
                        )
                    }

            return {"success": False, "message": "Invalid task/subtask combination"}

        except Exception as e:
            logger.error(f"Error generating new question: {e}")
            return {
                "success": False,
                "message": f"Failed to generate question: {str(e)}"
            }

    def submit_answer(self, user_email: str, project_id: str, task_index: int, 
                     subtask_index: int, question_id: str, answer_data: Dict) -> Dict:
        """Submit an answer and update context"""
        try:
            # Get project to access current context
            project_result = self.db.get_project(user_email, project_id)
            if not project_result["success"]:
                return project_result

            project = project_result["project"]
            current_context = project.get("context_for_LLM", "")

            # Get the question text (need to regenerate or fetch from previous call)
            question_result = self._get_question_text(user_email, project_id, task_index, subtask_index)
            question_text = question_result.get("questionText", "")

            # Prepare answer data
            answer_type = answer_data.get("answerType", "text")
            user_response = None
            file_url = None
            file_name = None

            if answer_type == "text":
                user_response = answer_data.get("textAnswer", "")
            elif answer_type == "radio":
                user_response = answer_data.get("selectedOption", "")
            elif answer_type == "file":
                file_url = answer_data.get("fileUrl", "")
                file_name = answer_data.get("fileName", "")
                user_response = f"Uploaded file: {file_name}"

            # Save question and answer
            save_result = self.db.save_question_answer(
                user_email=user_email,
                project_id=project_id,
                task_index=task_index,
                subtask_index=subtask_index,
                question_id=question_id,
                question_text=question_text,
                question_type=answer_type,
                user_response=user_response,
                file_url=file_url,
                file_name=file_name
            )

            if not save_result["success"]:
                return save_result

            # Update context for LLM
            # Special handling for Task 2, Subtask 1 (Data Summary): append full dataset summary as JSON
            if task_index == 2 and subtask_index == 1:
                # Get the CSV file key from the answer to subtask 0
                csv_answer = self.db.get_specific_answer(user_email, project_id, task_index, 0)
                file_key = csv_answer["answer"].get("fileUrl", "")
                summary = self.s3.get_dataset_summary(file_key)
                if summary:
                    try:
                        response = self.s3.s3_client.get_object(Bucket=self.s3.bucket_name, Key=file_key)
                        file_content = response['Body'].read()
                        csv_string = file_content.decode('utf-8')
                        df = pd.read_csv(io.StringIO(csv_string))
                        summary_for_llm = copy.deepcopy(summary)
                        summary_for_llm['dataPreview'] = df.head(10).to_dict('records')
                    except Exception as e:
                        summary_for_llm = summary
                    context_addition = f"\n\nDATASET_SUMMARY_JSON: {json.dumps(summary_for_llm)}\n\n"
                else:
                    context_addition = ""
            else:
                context_addition = self.ai.build_context_string(
                    question=question_text,
                    user_response=user_response,
                    csv_preview=self._get_csv_preview_for_context(file_url) if answer_type == "file" else None
                )

            new_context = current_context + context_addition

            # Update project context
            context_result = self.db.update_project_context(user_email, project_id, new_context)
            
            if not context_result["success"]:
                logger.warning(f"Failed to update context for project {project_id}")

            return {
                "success": True,
                "message": "Answer submitted successfully",
                "data": save_result["data"]
            }

        except Exception as e:
            logger.error(f"Error submitting answer: {e}")
            return {
                "success": False,
                "message": f"Failed to submit answer: {str(e)}"
            }

    def _get_question_text(self, user_email: str, project_id: str, task_index: int, subtask_index: int) -> Dict:
        """Helper to get question text for context building"""
        # This is a simplified version - in practice, you might want to store questions separately
        question_result = self.get_or_generate_question(user_email, project_id, task_index, subtask_index)
        if question_result["success"]:
            return {"questionText": question_result["question"].questionText}
        return {"questionText": ""}

    def _get_csv_preview_for_context(self, file_url: Optional[str]) -> Optional[str]:
        """Get CSV preview for context building"""
        if not file_url:
            return None
        
        try:
            file_key = file_url.split("/")[-1]
            is_valid, message, csv_data = self.s3.validate_and_process_csv(file_key)
            
            if is_valid and csv_data:
                # Return first 3 rows as preview
                preview_data = csv_data[:3]
                return json.dumps(preview_data, indent=2)
        except Exception as e:
            logger.error(f"Error getting CSV preview: {e}")
        
        return None

    def _format_dataset_summary(self, summary: Dict[str, Any]) -> str:
        """Format dataset summary for display"""
        lines = [
            f"Rows: {summary['rowCount']:,}",
            f"Columns: {summary['columnCount']}",
            "",
            "Column Information:"
        ]
        
        for col in summary['columns']:
            missing = summary['missingValues'].get(col['name'], 0)
            lines.append(f"  • {col['name']}: {col['type']} ({col['unique_values']} unique values, {missing} missing)")
        
        if any(summary['missingValues'].values()):
            lines.append("")
            lines.append("Missing Values Summary:")
            for col, missing in summary['missingValues'].items():
                if missing > 0:
                    percentage = (missing / summary['rowCount']) * 100
                    lines.append(f"  • {col}: {missing} ({percentage:.1f}%)")
        
        return "\n".join(lines)

# Global instance
question_service = QuestionService()