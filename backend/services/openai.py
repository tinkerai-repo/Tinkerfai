import openai
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from config import settings
from models import (
    QuestionType, AIQuestionGenerationResponse, AITargetColumnResponse, 
    AIProblemTypeResponse, AIFeatureSelectionResponse,
    # NEW: Task 4 imports
    AIModelSelectionResponse, AIHyperparameterResponse, AICodeGenerationResponse
)
import re

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        # Initialize OpenAI client with new API
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4"
        self.model_advanced = "gpt-4o"  # For complex tasks like code generation
        self.max_retries = 3
        self.retry_delay = 1.0

    def _make_api_call(self, messages: List[Dict[str, str]], temperature: float = 0.7, model: str = None) -> Optional[str]:
        """Make OpenAI API call with retry logic"""
        for attempt in range(self.max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=model or self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=1000 if model != self.model_advanced else 2000
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
            
            # Task 3 questions are handled in question.py with static templates
            elif task_index == 3:
                return AIQuestionGenerationResponse(
                    success=True,
                    question="Task 3 question placeholder",
                    questionType=QuestionType.TEXT
                )
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
1. A valid dataset (not gibberish); don't worry about missing or null values (we will handle that in the next step)
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

    def generate_feature_columns(self, csv_data: List[Dict[str, Any]], target_column: str, context: str) -> AIFeatureSelectionResponse:
        """Generate suitable feature columns for prediction using GPT-4o"""
        try:
            columns = list(csv_data[0].keys()) if csv_data else []
            # Remove target column from available features
            available_features = [col for col in columns if col != target_column]
            
            messages = [
                {
                    "role": "system",
                    "content": """You are a machine learning expert. Your task is to analyze a dataset and recommend which columns would be good features/predictors for a given target variable.

    Return your response in this exact JSON format:
    {
        "feature_columns": ["col1", "col2", "col3"]
    }

    Only include columns that would likely be useful predictors. Exclude:
    - ID columns, names, or unique identifiers
    - Columns that would cause data leakage (future information)
    - Columns with too many missing values
    - Irrelevant columns for the prediction task"""
                },
                {
                    "role": "user",
                    "content": f"""
    Analyze this dataset for feature selection:

    Context: {context}

    Target column to predict: {target_column}
    Available feature columns: {available_features}

    Sample data (first 5 rows):
    {json.dumps(csv_data[:5], indent=2)}

    Recommend which columns would be good features for predicting {target_column}. Consider:
    1. Relevance to the prediction task
    2. Data quality and completeness
    3. Avoiding data leakage
    4. Statistical significance potential

    Return only the JSON object with feature_columns list.
    """
                }
            ]

            response_text = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.3,
                max_tokens=1000
            ).choices[0].message.content.strip()
            
            # Better JSON cleaning - handle multiple formats
            cleaned = response_text
            
            # Remove markdown code blocks if present
            if "```" in cleaned:
                cleaned = re.sub(r"```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"```\s*", "", cleaned)
            
            # Remove any leading/trailing whitespace
            cleaned = cleaned.strip()
            
            # Find JSON object if it's embedded in other text
            json_match = re.search(r'\{[^{}]*"feature_columns"[^{}]*\}', cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
            
            logger.info(f"Cleaned JSON for parsing: {cleaned}")
            
            try:
                result = json.loads(cleaned)
                feature_columns = result.get("feature_columns", [])
                
                # Ensure we don't include the target column
                feature_columns = [col for col in feature_columns if col != target_column and col in available_features]
                
                logger.info(f"Successfully parsed feature columns: {feature_columns}")
                
                return AIFeatureSelectionResponse(
                    success=True,
                    featuresColumns=feature_columns
                )
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                logger.error(f"Failed to parse JSON response: {cleaned}")
                
                # Fallback: try to extract column names from the response text
                fallback_columns = []
                for col in available_features:
                    if col in response_text:
                        fallback_columns.append(col)
                
                if fallback_columns:
                    logger.info(f"Using fallback extraction: {fallback_columns}")
                    return AIFeatureSelectionResponse(
                        success=True,
                        featuresColumns=fallback_columns[:10]  # Limit to 10 columns
                    )
                
                return AIFeatureSelectionResponse(
                    success=False,
                    error="Failed to parse AI response"
                )

        except Exception as e:
            logger.error(f"Error generating feature columns: {e}")
            return AIFeatureSelectionResponse(
                success=False,
                error=f"Failed to analyze features: {str(e)}"
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

    # NEW: Task 4 AI Functions

    def generate_model_options(self, context: str, problem_type: str) -> AIModelSelectionResponse:
        """Generate suitable ML models based on context and problem type"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are a machine learning expert. Based on the given context and problem type, recommend the most suitable ML models.

Return your response in this exact JSON format:
{
    "models": ["Model 1", "Model 2", "Model 3", "Model 4", "Model 5", "Model 6"]
}

Order the models by suitability/preference for the given context. Limit to maximum 6 models.
Use standard scikit-learn model names exactly as they appear in sklearn documentation."""
                },
                {
                    "role": "user",
                    "content": f"""
Based on this context and problem type, recommend suitable ML models:

Context: {context}

Problem Type: {problem_type}

For {problem_type} problems, consider factors like:
- Dataset size and complexity
- Interpretability requirements  
- Performance expectations
- Computational efficiency

Available {problem_type} models:
- Classification: Support Vector Machine, Decision Tree Classifier, Random Forest Classifier, Naive Bayes, Logistic Regression, K-Nearest Neighbors, Gradient Boosting Classifier
- Regression: Linear Regression, Decision Tree Regressor, Random Forest Regressor, Support Vector Regression, Ridge Regression, Lasso Regression, Gradient Boosting Regressor

Return models in order of preference (most suitable first). Maximum 6 models.
"""
                }
            ]

            response_text = self._make_api_call(messages, temperature=0.3)
            
            # Clean and parse JSON
            cleaned = response_text.strip()
            if "```" in cleaned:
                cleaned = re.sub(r"```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"```\s*", "", cleaned)
            
            try:
                result = json.loads(cleaned)
                models = result.get("models", [])
                
                # Limit to 6 models
                models = models[:6]
                
                return AIModelSelectionResponse(
                    success=True,
                    models=models
                )
            except json.JSONDecodeError:
                logger.error(f"Failed to parse model selection response: {response_text}")
                return AIModelSelectionResponse(
                    success=False,
                    error="Failed to parse AI response"
                )

        except Exception as e:
            logger.error(f"Error generating model options: {e}")
            return AIModelSelectionResponse(
                success=False,
                error=f"Failed to generate model options: {str(e)}"
            )

    def generate_hyperparameters(self, context: str, selected_model: str, problem_type: str) -> AIHyperparameterResponse:
        """Generate hyperparameter configuration for selected model"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are a machine learning expert. For the given model, identify 0-3 most impactful hyperparameters.

Return your response in this exact JSON format:
{
    "hyperparameters": [
        {
            "name": "parameter_name",
            "type": "integer|float|select",
            "min": 1,
            "max": 100,
            "default": 10,
            "options": ["option1", "option2"] (only for select type),
            "description": "Brief description"
        }
    ]
}

IMPORTANT RULES:
- For "default": use actual numeric values or strings, never use null/None
- For integer parameters without a good default, use a reasonable middle value
- For select parameters, always provide options array and set default to first option
- name: exact parameter name used in sklearn
- type: "integer", "float", or "select" (for categorical)
- min/max: reasonable ranges based on typical use
- default: recommended starting value (never null/None)
- description: brief explanation of what it controls

Return 0-3 most impactful hyperparameters only."""
                },
                {
                    "role": "user",
                    "content": f"""
Generate hyperparameter configuration for this model:

Model: {selected_model}
Problem Type: {problem_type}
Context: {context}

Consider the dataset characteristics and problem complexity when setting ranges and defaults.
Focus on hyperparameters that have the most impact on model performance.

If the model has no important hyperparameters to tune (like Linear Regression), return an empty hyperparameters array.

For RandomForestClassifier, focus on n_estimators, max_depth, min_samples_split.
For KNeighborsClassifier, focus on n_neighbors, weights, metric.

Always provide valid default values - never use null or None.
"""
                }
            ]

            response_text = self._make_api_call(messages, temperature=0.3, model=self.model_advanced)
            
            # Enhanced JSON cleaning for hyperparameters
            cleaned = response_text.strip()
            
            # Remove markdown code blocks
            if "```json" in cleaned:
                cleaned = re.sub(r"```json\s*", "", cleaned)
                cleaned = re.sub(r"```\s*$", "", cleaned)
            elif "```" in cleaned:
                cleaned = re.sub(r"```\s*", "", cleaned)
            
            # Fix Python None to JSON null
            cleaned = cleaned.replace('"default": None', '"default": null')
            
            # Find complete JSON object
            json_match = re.search(r'\{.*?"hyperparameters".*?\]\s*\}', cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
            
            logger.info(f"Cleaned hyperparameter JSON: {cleaned}")
            
            try:
                result = json.loads(cleaned)
                hyperparameters = result.get("hyperparameters", [])
                
                # Validate and fix hyperparameters structure
                validated_params = []
                for param in hyperparameters[:3]:  # Max 3 parameters
                    if isinstance(param, dict) and all(key in param for key in ["name", "type", "default"]):
                        # Convert null back to None for Python, but handle properly
                        if param["default"] is None:
                            if param["type"] == "select":
                                continue  # Skip parameters with None default for select type
                            else:
                                param["default"] = 10 if param["type"] == "integer" else 1.0  # Fallback defaults
                        
                        # Ensure proper types
                        if param["type"] in ["integer", "float", "select"]:
                            validated_params.append(param)
                
                logger.info(f"Validated hyperparameters: {validated_params}")
                
                return AIHyperparameterResponse(
                    success=True,
                    hyperparameters=validated_params
                )
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse hyperparameter JSON: {e}")
                logger.error(f"Raw response: {response_text}")
                logger.error(f"Cleaned response: {cleaned}")
                
                # Return empty hyperparameters as fallback
                return AIHyperparameterResponse(
                    success=True,
                    hyperparameters=[]
                )

        except Exception as e:
            logger.error(f"Error generating hyperparameters: {e}")
            return AIHyperparameterResponse(
                success=False,
                error=f"Failed to generate hyperparameters: {str(e)}"
            )

    def generate_ml_code(self, context: str, model_type: str, train_test_split: int, 
                        hyperparameters: Dict[str, Any]) -> AICodeGenerationResponse:
        """Generate complete ML code using GPT-4o"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are a senior data scientist and Python expert. Generate complete, production-ready machine learning code.

The code should:
1. Import all necessary libraries (pandas, numpy, scikit-learn, etc.)
2. Load and preprocess the dataset based on user selections
3. Handle missing values, normalization, encoding as needed
4. Split data into train/test sets
5. Train the specified model with given hyperparameters
6. Include basic model evaluation
7. Save the trained model for future use

Requirements:
- Use only standard libraries (pandas, numpy, scikit-learn, joblib)
- Add clear but concise comments (every 3-4 lines)
- Structure code in logical sections
- Handle both numerical and categorical features
- Include proper error handling
- Make code educational but not overwhelming

Return only the Python code, no explanations before or after."""
                },
                {
                    "role": "user",
                    "content": f"""
Generate ML code based on this context:

Context (includes all user selections): {context}

Model: {model_type}
Train/Test Split: {train_test_split}% train, {100-train_test_split}% test
Hyperparameters: {hyperparameters}

The context contains information about:
- Dataset structure and columns
- Target column selection
- Feature columns selection
- Missing value handling preferences
- Normalization preferences
- Problem type (classification/regression)

Generate complete Python code that implements the full ML pipeline from data loading to model saving.
"""
                }
            ]

            response_text = self._make_api_call(messages, temperature=0.3, model=self.model_advanced)
            
            # Clean the code response
            cleaned_code = response_text.strip()
            
            # Remove markdown code blocks if present
            if "```python" in cleaned_code:
                cleaned_code = re.sub(r"```python\s*", "", cleaned_code)
                cleaned_code = re.sub(r"```\s*$", "", cleaned_code)
            elif "```" in cleaned_code:
                cleaned_code = re.sub(r"```\s*", "", cleaned_code)
            
            return AICodeGenerationResponse(
                success=True,
                code=cleaned_code.strip()
            )

        except Exception as e:
            logger.error(f"Error generating ML code: {e}")
            return AICodeGenerationResponse(
                success=False,
                error=f"Failed to generate code: {str(e)}"
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