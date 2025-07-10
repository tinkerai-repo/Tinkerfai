import openai
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from config import settings
from models import (
    QuestionType, AIQuestionGenerationResponse, AITargetColumnResponse, 
    AIProblemTypeResponse
)
import re

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        # Initialize OpenAI client with new API
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4"
        self.max_retries = 3
        self.retry_delay = 1.0

    def _make_api_call(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> Optional[str]:
        """Make OpenAI API call with retry logic"""
        for attempt in range(self.max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=1000
                )
                return response.choices[0].message.content.strip()
            
            except Exception as e:
                logger.warning(f"OpenAI API call failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                else:
                    logger.error(f"OpenAI API call failed after {self.max_retries} attempts")
                    raise e

    def generate_task1_question(self, project_name: str, project_type: str) -> AIQuestionGenerationResponse:
        """Generate the initial project idea question for Task 1"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are an AI tutor helping users learn data science through hands-on projects. Generate engaging questions that encourage users to think about their project goals."
                },
                {
                    "role": "user",
                    "content": f"Generate a welcoming question asking the user about their project idea for a {project_type} level data science project named '{project_name}'. Keep it encouraging and specific. The question should prompt them to describe what they want to build/analyze."
                }
            ]

            response_text = self._make_api_call(messages)
            
            return AIQuestionGenerationResponse(
                success=True,
                question=response_text,
                questionType=QuestionType.TEXT
            )

        except Exception as e:
            logger.error(f"Error generating Task 1 question: {e}")
            return AIQuestionGenerationResponse(
                success=False,
                error=f"Failed to generate question: {str(e)}"
            )

    def generate_dynamic_question(self, context: str, project_name: str, project_type: str, 
                                task_index: int, subtask_index: int) -> AIQuestionGenerationResponse:
        """Generate dynamic questions based on context and task position"""
        try:
            if task_index == 2:
                if subtask_index == 1:
                    # CSV Upload question
                    prompt = f"""
Based on the following context about the user's project:

{context}

Generate an encouraging question that asks the user to upload their CSV dataset. The question should:
1. Reference their specific project idea
2. Explain that they need to upload a CSV file to continue
3. Be motivating and specific to their goals
4. Mention that the file will be analyzed to help them

Keep it conversational and supportive.
"""
                elif subtask_index == 2:
                    return AIQuestionGenerationResponse(
                        success=True,
                        question="Choose the column you want to predict:",
                        questionType=QuestionType.RADIO
                    )
                elif subtask_index == 3:
                    # Problem type confirmation
                    prompt = f"""
Based on the following project context:

{context}

Generate a confirmation message that explains what type of machine learning problem this is (regression or classification) and why. The message should:
1. State whether it's regression or classification
2. Briefly explain the reasoning based on their target column
3. Be educational but concise
4. End with "Click submit to proceed to the next step."

Be confident in your assessment and educational in your explanation.
"""
                elif subtask_index == 4:
                    return AIQuestionGenerationResponse(
                        success=True,
                        question="Review your dataset summary below. Click submit when you're ready to proceed to the next step.",
                        questionType=QuestionType.READONLY
                    )
                else:
                    raise ValueError(f"Unknown subtask index: {subtask_index}")
            else:
                raise ValueError(f"Unknown task index: {task_index}")

            messages = [
                {
                    "role": "system",
                    "content": "You are an AI tutor for data science. Generate clear, encouraging questions that guide users through their learning journey. Be specific and actionable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]

            response_text = self._make_api_call(messages)
            question_type = QuestionType.FILE if subtask_index == 1 else QuestionType.READONLY

            return AIQuestionGenerationResponse(
                success=True,
                question=response_text,
                questionType=question_type
            )

        except Exception as e:
            logger.error(f"Error generating dynamic question: {e}")
            return AIQuestionGenerationResponse(
                success=False,
                error=f"Failed to generate question: {str(e)}"
            )

    def validate_csv_content(self, csv_data: List[Dict[str, Any]], context: str) -> Tuple[bool, str]:
        """Validate CSV content using OpenAI"""
        try:
            sample_data = json.dumps(csv_data[:5], indent=2) if csv_data else "No data"
            
            messages = [
                {
                    "role": "system",
                    "content": """You are a data validation expert. Analyze CSV data and determine if it's suitable for machine learning projects. 

Return your response in this exact JSON format:
{
    "is_valid": true/false,
    "message": "explanation message"
}"""
                },
                {
                    "role": "user",
                    "content": f"""
Analyze this CSV data sample and context:

Context: {context}

Sample data (first 5 rows):
{sample_data}

Determine if this data is:
1. A valid dataset (not gibberish)
2. Suitable for machine learning
3. Has meaningful column names
4. Contains data that matches the user's project goals

If invalid, explain what's wrong. If valid, confirm it looks good for their project.
"""
                }
            ]

            response_text = self._make_api_call(messages, temperature=0.3)
            
            try:
                result = json.loads(response_text)
                return result.get("is_valid", False), result.get("message", "Unknown validation error")
            except json.JSONDecodeError:
                is_valid = "valid" in response_text.lower() and "true" in response_text.lower()
                return is_valid, response_text

        except Exception as e:
            logger.error(f"Error validating CSV: {e}")
            return False, f"Validation failed: {str(e)}"

    def generate_target_columns(self, csv_data: List[Dict[str, Any]], context: str) -> AITargetColumnResponse:
        """Generate suitable target columns for regression/classification using gpt-4o"""
        try:
            columns = list(csv_data[0].keys()) if csv_data else []
            messages = [
                {
                    "role": "system",
                    "content": """You are a machine learning expert. Your task is to analyze a dataset and recommend which columns are most suitable as prediction targets for machine learning tasks.\n\nReturn your response in this exact JSON format, as direct text only (do not use markdown, code blocks, or any extra formatting):\n{\n    \"regression_columns\": [\"col1\", \"col2\"],\n    \"classification_columns\": [\"col3\", \"col4\"]\n}\n\nOnly include columns that are truly suitable for prediction. Some columns might not be suitable for either."""
                },
                {
                    "role": "user",
                    "content": f"""
Analyze the following dataset for the user's project.\n\nThe full dataset summary, including column types, unique values, missing values, means, modes, and sample rows, is provided in the context above as a JSON object.\n\nAvailable columns: {columns}\n\nIdentify which columns would be good targets for:\n1. Regression (predicting continuous numerical values)\n2. Classification (predicting categories/classes)\n\nGuidelines:\n- Use the dataset summary in the context to inform your decision.\n- For classification, prefer columns that are categorical or text with a manageable number of unique values (not too many), and are not mostly missing.\n- Exclude columns that are IDs, names, or otherwise not meaningful as prediction targets.\n- If you are unsure about a column, do not include it.\n- Do not guess if the information is not sufficient.\n\nReturn only the JSON object as specified.\n"""
                }
            ]

            # Use gpt-4o for this task
            response_text = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.3,
                max_tokens=1000
            ).choices[0].message.content.strip()
            cleaned = re.sub(r"^```(?:json)?\\n|```$", "", response_text.strip(), flags=re.MULTILINE).strip()
            try:
                result = json.loads(cleaned)
                return AITargetColumnResponse(
                    success=True,
                    regressionColumns=result.get("regression_columns", []),
                    classificationColumns=result.get("classification_columns", [])
                )
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON response: {response_text}")
                return AITargetColumnResponse(
                    success=False,
                    error="Failed to parse AI response"
                )

        except Exception as e:
            logger.error(f"Error generating target columns: {e}")
            return AITargetColumnResponse(
                success=False,
                error=f"Failed to analyze columns: {str(e)}"
            )

    def detect_problem_type(self, target_column: str, csv_data: List[Dict[str, Any]], context: str) -> AIProblemTypeResponse:
        """Detect if the problem is regression or classification"""
        try:
            target_values = [row.get(target_column) for row in csv_data[:20] if target_column in row]
            unique_values = list(set(target_values))[:10]
            
            messages = [
                {
                    "role": "system",
                    "content": """You are a machine learning expert. Determine if a prediction problem is regression or classification.

Return your response in this exact JSON format:
{
    "problem_type": "regression" or "classification",
    "explanation": "brief explanation of why"
}"""
                },
                {
                    "role": "user",
                    "content": f"""
Analyze this target column for problem type:

Context: {context}

Target column: {target_column}
Sample values: {target_values[:10]}
Unique values (sample): {unique_values}
Total unique values in sample: {len(set(target_values))}

Determine if this is regression (continuous numerical prediction) or classification (category prediction).
Consider the data type, number of unique values, and the nature of the values.
"""
                }
            ]

            response_text = self._make_api_call(messages, temperature=0.3)
            
            try:
                result = json.loads(response_text)
                return AIProblemTypeResponse(
                    success=True,
                    problemType=result.get("problem_type"),
                    explanation=result.get("explanation")
                )
            except json.JSONDecodeError:
                is_regression = any(keyword in response_text.lower() for keyword in ["regression", "continuous", "numerical"])
                problem_type = "regression" if is_regression else "classification"
                
                return AIProblemTypeResponse(
                    success=True,
                    problemType=problem_type,
                    explanation=response_text
                )

        except Exception as e:
            logger.error(f"Error detecting problem type: {e}")
            return AIProblemTypeResponse(
                success=False,
                error=f"Failed to detect problem type: {str(e)}"
            )

    def build_context_string(self, question: str, user_response: Optional[str] = None, 
                           options: Optional[List[str]] = None, csv_preview: Optional[str] = None) -> str:
        """Build context string for LLM"""
        context_parts = [f"Question: {question}"]
        
        if options:
            context_parts.append(f"Options: {', '.join(options)}")
        
        if csv_preview:
            context_parts.append(f"CSV Preview: {csv_preview}")
        
        if user_response:
            context_parts.append(f"User Response: {user_response}")
        
        return "\n".join(context_parts) + "\n\n"

# Global instance
openai_service = OpenAIService()