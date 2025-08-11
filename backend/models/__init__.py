from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Existing authentication models (unchanged)
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    confirmPassword: str
    firstName: str
    lastName: str

class SigninRequest(BaseModel):
    email: EmailStr
    password: str

class ConfirmSignupRequest(BaseModel):
    email: EmailStr
    confirmationCode: str

class ResendConfirmationRequest(BaseModel):
    email: EmailStr

class TokenValidateRequest(BaseModel):
    accessToken: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    confirmationCode: str
    newPassword: str
    confirmPassword: str

# Enhanced project models
class CreateProjectRequest(BaseModel):
    projectName: str
    projectType: str  # 'beginner' or 'expert'

class ProjectResponse(BaseModel):
    projectId: str
    projectName: str
    projectType: str
    createdAt: str
    updatedAt: str
    userEmail: str
    context_for_LLM: str = ""  # New field for AI context

# Enhanced question system models - UPDATED with Task 4 question types
class QuestionType(str, Enum):
    TEXT = "text"
    RADIO = "radio"
    FILE = "file"
    READONLY = "readonly"
    MULTISELECT = "multiselect"
    SLIDER = "slider"  # NEW: For train-test split
    HYPERPARAMETER = "hyperparameter"  # NEW: For hyperparameter configuration

class QuestionRequest(BaseModel):
    userEmail: str
    projectId: str
    taskIndex: int
    subtaskIndex: int

class QuestionResponse(BaseModel):
    questionId: str
    taskIndex: int
    subtaskIndex: int
    questionType: QuestionType
    questionText: str
    options: Optional[List[str]] = None
    isRequired: bool = True
    fileTypes: Optional[List[str]] = None  # For file uploads (e.g., [".csv"])
    maxFileSize: Optional[int] = None  # In bytes
    # Task 3 fields
    missingInfo: Optional[Dict[str, Any]] = None  # For missing values info
    classDistribution: Optional[Dict[str, int]] = None  # For class imbalance info
    # NEW: Task 4 fields
    sliderConfig: Optional[Dict[str, Any]] = None  # For slider configuration
    hyperparameters: Optional[List[Dict[str, Any]]] = None  # For hyperparameter configs
    generatedCode: Optional[str] = None  # For code generation display

class AnswerSubmissionRequest(BaseModel):
    userEmail: str
    projectId: str
    taskIndex: int
    subtaskIndex: int
    questionId: str
    answerType: QuestionType
    textAnswer: Optional[str] = None
    selectedOption: Optional[str] = None
    selectedOptions: Optional[List[str]] = None  # For multiselect
    fileName: Optional[str] = None
    fileUrl: Optional[str] = None
    # NEW: Task 4 answer fields
    sliderValue: Optional[int] = None  # For slider (train percentage)
    hyperparameterValues: Optional[Dict[str, Any]] = None  # For hyperparameters

class AnswerResponse(BaseModel):
    userEmail: str
    projectId: str
    taskIndex: int
    subtaskIndex: int
    questionId: str
    answerType: QuestionType
    textAnswer: Optional[str] = None
    selectedOption: Optional[str] = None
    selectedOptions: Optional[List[str]] = None  # For multiselect
    fileName: Optional[str] = None
    fileUrl: Optional[str] = None
    answeredAt: str
    # NEW: Task 4 answer fields
    sliderValue: Optional[int] = None  # For slider (train percentage)
    hyperparameterValues: Optional[Dict[str, Any]] = None  # For hyperparameters

# File upload models (unchanged)
class FileUploadRequest(BaseModel):
    projectId: str
    taskIndex: int
    subtaskIndex: int
    fileName: str

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    uploadUrl: Optional[str] = None  # Pre-signed S3 URL
    fileKey: Optional[str] = None

class FileValidationResponse(BaseModel):
    success: bool
    message: str
    isValid: bool
    validationDetails: Optional[Dict[str, Any]] = None

# CSV analysis models (unchanged)
class DatasetSummaryResponse(BaseModel):
    rowCount: int
    columnCount: int
    columns: List[Dict[str, Any]]  # Now allows mean, mode, semantic_type, etc.
    missingValues: Dict[str, int]  # {"col1": 5, "col2": 0}
    dataPreview: List[Dict[str, Any]]  # First few rows

# AI-generated content models
class AIQuestionGenerationRequest(BaseModel):
    projectId: str
    taskIndex: int
    subtaskIndex: int
    context: str
    projectName: str
    projectType: str

class AIQuestionGenerationResponse(BaseModel):
    success: bool
    question: Optional[str] = None
    questionType: Optional[QuestionType] = None
    options: Optional[List[str]] = None
    error: Optional[str] = None

class AITargetColumnRequest(BaseModel):
    projectId: str
    csvData: List[Dict[str, Any]]  # Sample rows from CSV
    context: str

class AITargetColumnResponse(BaseModel):
    success: bool
    regressionColumns: List[str] = []
    classificationColumns: List[str] = []
    error: Optional[str] = None

# AI Feature Selection for Task 3
class AIFeatureSelectionRequest(BaseModel):
    projectId: str
    csvData: List[Dict[str, Any]]
    targetColumn: str
    context: str

class AIFeatureSelectionResponse(BaseModel):
    success: bool
    featuresColumns: List[str] = []
    error: Optional[str] = None

class AIProblemTypeRequest(BaseModel):
    projectId: str
    targetColumn: str
    csvData: List[Dict[str, Any]]
    context: str

class AIProblemTypeResponse(BaseModel):
    success: bool
    problemType: Optional[str] = None  # "regression" or "classification"
    explanation: Optional[str] = None
    error: Optional[str] = None

# NEW: Task 4 AI Models
class AIModelSelectionRequest(BaseModel):
    projectId: str
    context: str
    problemType: str  # "regression" or "classification"

class AIModelSelectionResponse(BaseModel):
    success: bool
    models: List[str] = []  # Ordered list of suitable models
    error: Optional[str] = None

class AIHyperparameterRequest(BaseModel):
    projectId: str
    context: str
    selectedModel: str
    problemType: str

class AIHyperparameterResponse(BaseModel):
    success: bool
    hyperparameters: List[Dict[str, Any]] = []  # List of hyperparameter configs
    error: Optional[str] = None

class AICodeGenerationRequest(BaseModel):
    projectId: str
    context: str
    modelType: str
    trainTestSplit: int  # train percentage
    hyperparameters: Dict[str, Any]

class AICodeGenerationResponse(BaseModel):
    success: bool
    code: Optional[str] = None
    error: Optional[str] = None

# Enhanced response models (unchanged)
class GetProjectsResponse(BaseModel):
    success: bool
    message: str
    projects: List[ProjectResponse]

class CreateProjectResponse(BaseModel):
    success: bool
    message: str
    project: ProjectResponse

class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None

# Progress tracking models (unchanged)
class UserProgressResponse(BaseModel):
    userEmail: str
    projectId: str
    currentTask: int
    currentSubtask: int
    completedTasks: List[int]
    completedSubtasks: Dict[str, List[int]]  # {"1": [0], "2": [0, 1]}
    answers: List[AnswerResponse]