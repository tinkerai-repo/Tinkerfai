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
                        selectedOptions=answer_data.get("selectedOptions") if answer_data.get("questionType") == "multiselect" else None,  # NEW
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
                    
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=task_index,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.READONLY,
                            questionText="Review your dataset summary below. Click submit when you're ready to proceed to the next step.",
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

            # NEW: Task 3 handling
            elif task_index == 3:
                return self._generate_task3_question(user_email, project_id, subtask_index, question_id, context)

            return {"success": False, "message": "Invalid task/subtask combination"}

        except Exception as e:
            logger.error(f"Error generating new question: {e}")
            return {
                "success": False,
                "message": f"Failed to generate question: {str(e)}"
            }

    def _generate_task3_question(self, user_email: str, project_id: str, subtask_index: int, question_id: str, context: str) -> Dict:
        """Generate Task 3 questions (Feature Engineering)"""
        try:
            if subtask_index == 0:
                # Q1: Feature Selection (Multi-select)
                # Get target column from Task 2
                target_answer = self.db.get_specific_answer(user_email, project_id, 2, 2)
                if not target_answer["success"]:
                    return {"success": False, "message": "Target column selection required from Task 2"}
                
                target_column = target_answer["answer"].get("userResponse", "")
                
                # Get CSV data
                csv_answer = self.db.get_specific_answer(user_email, project_id, 2, 0)
                file_key = csv_answer["answer"].get("fileUrl", "")
                is_valid, message, csv_data = self.s3.validate_and_process_csv(file_key)
                if not is_valid:
                    return {"success": False, "message": message}
                
                # Generate feature columns using AI
                ai_response = self.ai.generate_feature_columns(csv_data, target_column, context)
                if not ai_response.success:
                    return {"success": False, "message": ai_response.error}
                
                if not ai_response.featuresColumns:
                    return {"success": False, "message": "No suitable feature columns found"}
                
                return {
                    "success": True,
                    "question": QuestionResponse(
                        questionId=question_id,
                        taskIndex=3,
                        subtaskIndex=subtask_index,
                        questionType=QuestionType.MULTISELECT,
                        questionText="Which columns should the model use to make predictions? (Select all that apply)",
                        options=ai_response.featuresColumns,
                        isRequired=True
                    )
                }

            elif subtask_index == 1:
                # Q2: Missing Values Handling
                # Get target and prediction columns
                target_answer = self.db.get_specific_answer(user_email, project_id, 2, 2)
                target_column = target_answer["answer"].get("userResponse", "")
                
                prediction_answer = self.db.get_specific_answer(user_email, project_id, 3, 0)
                prediction_columns = prediction_answer["answer"].get("selectedOptions", [])
                
                # Get CSV data and calculate missing values
                csv_answer = self.db.get_specific_answer(user_email, project_id, 2, 0)
                file_key = csv_answer["answer"].get("fileUrl", "")
                missing_info = self._calculate_missing_values_impact(file_key, target_column, prediction_columns)
                
                if missing_info["total_missing"] == 0:
                    # No missing values - readonly question
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=3,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.READONLY,
                            questionText="Great! There are no missing values in your selected columns. No data cleaning needed. Click submit to proceed.",
                            isRequired=False
                        )
                    }
                else:
                    # Has missing values - show options
                    drop_option = f"Drop rows with missing values ({missing_info['rows_to_drop']} of {missing_info['total_rows']}, which is {missing_info['drop_percentage']:.1f}% of the dataset)"
                    
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=3,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.RADIO,
                            questionText="How should we handle missing values in the selected columns?",
                            options=[
                                "Fill with mean (for numeric) / mode (for categorical)",
                                "Fill with median (for numeric) / mode (for categorical)",
                                drop_option
                            ],
                            isRequired=True,
                            missingInfo=missing_info
                        )
                    }

            elif subtask_index == 2:
                # Q3: Normalization
                return {
                    "success": True,
                    "question": QuestionResponse(
                        questionId=question_id,
                        taskIndex=3,
                        subtaskIndex=subtask_index,
                        questionType=QuestionType.RADIO,
                        questionText="Choose if you need normalization for numerical columns. (One-Hot Encoding is auto applied for all categorical variables)",
                        options=[
                            "Normalize / Standardize numeric features",
                            "Proceed without normalization"
                        ],
                        isRequired=True
                    )
                }

            elif subtask_index == 3:
                # Q4: Handle Imbalanced Classes (only for classification)
                # Get problem type from Task 2
                problem_type_answer = self.db.get_specific_answer(user_email, project_id, 2, 3)
                if problem_type_answer["success"]:
                    # Extract problem type from the readonly response
                    problem_text = problem_type_answer["answer"].get("questionText", "")
                    is_classification = "classification" in problem_text.lower()
                else:
                    # Fallback: detect from target column
                    target_answer = self.db.get_specific_answer(user_email, project_id, 2, 2)
                    target_column = target_answer["answer"].get("userResponse", "")
                    csv_answer = self.db.get_specific_answer(user_email, project_id, 2, 0)
                    file_key = csv_answer["answer"].get("fileUrl", "")
                    _, _, csv_data = self.s3.validate_and_process_csv(file_key)
                    ai_response = self.ai.detect_problem_type(target_column, csv_data, context)
                    is_classification = ai_response.problemType == "classification"
                
                if not is_classification:
                    # Regression - readonly
                    return {
                        "success": True,
                        "question": QuestionResponse(
                            questionId=question_id,
                            taskIndex=3,
                            subtaskIndex=subtask_index,
                            questionType=QuestionType.READONLY,
                            questionText="This is a regression problem. Handling class imbalance is not needed for regression tasks. Click submit to proceed.",
                            isRequired=False
                        )
                    }
                else:
                    # Classification - check for imbalance
                    target_answer = self.db.get_specific_answer(user_email, project_id, 2, 2)
                    target_column = target_answer["answer"].get("userResponse", "")
                    csv_answer = self.db.get_specific_answer(user_email, project_id, 2, 0)
                    file_key = csv_answer["answer"].get("fileUrl", "")
                    class_info = self._analyze_class_distribution(file_key, target_column)
                    
                    if class_info["is_balanced"]:
                        return {
                            "success": True,
                            "question": QuestionResponse(
                                questionId=question_id,
                                taskIndex=3,
                                subtaskIndex=subtask_index,
                                questionType=QuestionType.READONLY,
                                questionText=f"Your target column has balanced classes: {class_info['distribution_text']}. No oversampling needed. Click submit to proceed.",
                                isRequired=False
                            )
                        }
                    else:
                        return {
                            "success": True,
                            "question": QuestionResponse(
                                questionId=question_id,
                                taskIndex=3,
                                subtaskIndex=subtask_index,
                                questionType=QuestionType.RADIO,
                                questionText=f"Your target column has imbalanced classes: {class_info['distribution_text']}. Would you like to oversample rare classes?",
                                options=[
                                    "Yes, use oversampling",
                                    "No, continue without oversampling"
                                ],
                                isRequired=True,
                                classDistribution=class_info
                            )
                        }

            return {"success": False, "message": f"Unknown Task 3 subtask: {subtask_index}"}

        except Exception as e:
            logger.error(f"Error generating Task 3 question: {e}")
            return {
                "success": False,
                "message": f"Failed to generate Task 3 question: {str(e)}"
            }

    def _calculate_missing_values_impact(self, file_key: str, target_column: str, prediction_columns: List[str]) -> Dict[str, Any]:
        """Calculate impact of missing values on target and prediction columns"""
        try:
            response = self.s3.s3_client.get_object(Bucket=self.s3.bucket_name, Key=file_key)
            file_content = response['Body'].read()
            csv_string = file_content.decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_string))
            
            # Focus on target + prediction columns
            relevant_columns = [target_column] + prediction_columns
            subset_df = df[relevant_columns]
            
            # Count rows with any missing values in these columns
            rows_with_missing = subset_df.isnull().any(axis=1).sum()
            total_rows = len(df)
            
            # Calculate missing per column
            missing_per_column = {}
            for col in relevant_columns:
                missing_per_column[col] = int(df[col].isnull().sum())  # Convert to Python int
            
            drop_percentage = (rows_with_missing / total_rows) * 100 if total_rows > 0 else 0
            
            return {
                "total_missing": int(rows_with_missing),  # Convert to Python int
                "total_rows": int(total_rows),  # Convert to Python int
                "rows_to_drop": int(rows_with_missing),  # Convert to Python int
                "drop_percentage": float(drop_percentage),  # Convert to Python float
                "missing_per_column": missing_per_column,
                "columns_analyzed": relevant_columns
            }
            
        except Exception as e:
            logger.error(f"Error calculating missing values impact: {e}")
            return {
                "total_missing": 0,
                "total_rows": 0,
                "rows_to_drop": 0,
                "drop_percentage": 0.0,
                "missing_per_column": {},
                "columns_analyzed": []
            }

    def _analyze_class_distribution(self, file_key: str, target_column: str) -> Dict[str, Any]:
        """Analyze class distribution for imbalance detection"""
        try:
            response = self.s3.s3_client.get_object(Bucket=self.s3.bucket_name, Key=file_key)
            file_content = response['Body'].read()
            csv_string = file_content.decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_string))
            
            # Get class distribution
            class_counts = df[target_column].value_counts().to_dict()
            total_samples = len(df)
            num_classes = len(class_counts)
            
            # Calculate percentages
            class_percentages = {str(k): (v / total_samples) * 100 for k, v in class_counts.items()}
            
            min_percentage = min(class_percentages.values())
            max_percentage = max(class_percentages.values())
            min_count = min(class_counts.values())
            
            # Percentage-based minimum sample threshold
            if num_classes == 2:
                min_required_percentage = 5.0  # 5% for binary
            elif num_classes <= 4:
                min_required_percentage = 3.0  # 3% for 3-4 classes
            else:
                min_required_percentage = 2.0  # 2% for 5+ classes
            
            # Calculate minimum required count with safety net
            min_required_count = max(5, int(total_samples * (min_required_percentage / 100)))
            
            # Check if minority class has too few samples
            if min_count < min_required_count:
                is_balanced = True  # Don't recommend oversampling
                balance_reason = "insufficient_samples"
                message_suffix = f"The smallest class has only {min_count} samples ({min_percentage:.1f}%), which is insufficient for reliable oversampling techniques."
            else:
                # Normal balance detection
                if num_classes == 2:
                    # Binary: smallest class should be at least 30%
                    is_balanced = min_percentage >= 30.0
                    balance_reason = "threshold" if is_balanced else "imbalanced"
                else:
                    # Multi-class: use ratio-based approach
                    class_ratio = max_percentage / min_percentage
                    is_balanced = class_ratio <= 2.0
                    balance_reason = "ratio" if is_balanced else "imbalanced"
                
                message_suffix = ""
            
            # Create distribution text
            distribution_parts = []
            for class_name, count in class_counts.items():
                percentage = class_percentages[str(class_name)]
                distribution_parts.append(f"{class_name}: {count} ({percentage:.1f}%)")
            
            distribution_text = ", ".join(distribution_parts)
            
            return {
                "is_balanced": is_balanced,
                "balance_reason": balance_reason,
                "class_counts": {str(k): v for k, v in class_counts.items()},
                "class_percentages": class_percentages,
                "distribution_text": distribution_text,
                "min_percentage": float(min_percentage),
                "max_percentage": float(max_percentage),
                "min_count": int(min_count),
                "min_required_percentage": min_required_percentage,
                "min_required_count": min_required_count,
                "class_ratio": float(max_percentage / min_percentage),
                "num_classes": num_classes,
                "message_suffix": message_suffix,
                "total_samples": total_samples
            }
            
        except Exception as e:
            logger.error(f"Error analyzing class distribution: {e}")
            return {
                "is_balanced": True,
                "balance_reason": "error",
                "class_counts": {},
                "class_percentages": {},
                "distribution_text": "Unable to analyze class distribution",
                "min_percentage": 100.0,
                "max_percentage": 100.0,
                "min_count": 0,
                "min_required_percentage": 0.0,
                "min_required_count": 0,
                "class_ratio": 1.0,
                "num_classes": 0,
                "message_suffix": "",
                "total_samples": 0
            }

    def submit_answer(self, user_email: str, project_id: str, task_index: int, 
                 subtask_index: int, question_id: str, answer_data: Dict) -> Dict:
        """Submit an answer and update context"""
        try:
            # ENHANCED DEBUG LOGGING
            logger.info("=" * 50)
            logger.info(f"SUBMIT ANSWER DEBUG - Task {task_index}, Subtask {subtask_index}")
            logger.info(f"Raw answer_data received: {answer_data}")
            logger.info("=" * 50)
            
            # Get project to access current context
            project_result = self.db.get_project(user_email, project_id)
            if not project_result["success"]:
                return project_result

            project = project_result["project"]
            current_context = project.get("context_for_LLM", "")

            # Get the question text
            question_result = self._get_question_text(user_email, project_id, task_index, subtask_index)
            question_text = question_result.get("questionText", "")

            # Prepare answer data
            answer_type = answer_data.get("answerType", "text")
            user_response = None
            file_url = None
            file_name = None
            selected_options = None

            logger.info(f"Processing answer_type: {answer_type}")

            if answer_type == "text":
                user_response = answer_data.get("textAnswer", "")
            elif answer_type == "radio":
                user_response = answer_data.get("selectedOption", "")
            elif answer_type == "multiselect":
                selected_options = answer_data.get("selectedOptions", [])
                user_response = ", ".join(selected_options) if selected_options else ""
                
                # ENHANCED DEBUG FOR MULTISELECT
                logger.info(f"MULTISELECT PROCESSING:")
                logger.info(f"  - Raw selectedOptions from answer_data: {answer_data.get('selectedOptions')}")
                logger.info(f"  - Processed selected_options: {selected_options}")
                logger.info(f"  - Generated user_response: {user_response}")
                logger.info(f"  - Type of selected_options: {type(selected_options)}")
                
            elif answer_type == "file":
                file_url = answer_data.get("fileUrl", "")
                file_name = answer_data.get("fileName", "")
                user_response = f"Uploaded file: {file_name}"
            elif answer_type == "readonly":
                user_response = "User clicked Proceed"

            # DEBUG BEFORE DATABASE CALL
            logger.info(f"BEFORE DATABASE SAVE:")
            logger.info(f"  - user_response: {user_response}")
            logger.info(f"  - selected_options: {selected_options}")
            logger.info(f"  - question_type: {answer_type}")

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
                selected_options=selected_options,  # This should have the values
                file_url=file_url,
                file_name=file_name
            )

            logger.info(f"DATABASE SAVE RESULT: {save_result}")

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
                # For readonly questions, use "User clicked Proceed"
                display_response = "User clicked Proceed" if answer_type == "readonly" else user_response
                
                # For multiselect, show the selected options
                if answer_type == "multiselect" and selected_options:
                    display_response = ", ".join(selected_options)
                
                context_addition = self.ai.build_context_string(
                    question=question_text,
                    user_response=display_response,
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