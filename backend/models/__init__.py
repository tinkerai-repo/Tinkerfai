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

# New question system models
class QuestionType(str, Enum):
    TEXT = "text"
    RADIO = "radio"
    FILE = "file"
    READONLY = "readonly"

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

class AnswerSubmissionRequest(BaseModel):
    userEmail: str
    projectId: str
    taskIndex: int
    subtaskIndex: int
    questionId: str
    answerType: QuestionType
    textAnswer: Optional[str] = None
    selectedOption: Optional[str] = None
    fileName: Optional[str] = None
    fileUrl: Optional[str] = None

class AnswerResponse(BaseModel):
    userEmail: str
    projectId: str
    taskIndex: int
    subtaskIndex: int
    questionId: str
    answerType: QuestionType
    textAnswer: Optional[str] = None
    selectedOption: Optional[str] = None
    fileName: Optional[str] = None
    fileUrl: Optional[str] = None
    answeredAt: str

# File upload models
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

# CSV analysis models
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

# Enhanced response models
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

# Progress tracking models
class UserProgressResponse(BaseModel):
    userEmail: str
    projectId: str
    currentTask: int
    currentSubtask: int
    completedTasks: List[int]
    completedSubtasks: Dict[str, List[int]]  # {"1": [0], "2": [0, 1]}
    answers: List[AnswerResponse]