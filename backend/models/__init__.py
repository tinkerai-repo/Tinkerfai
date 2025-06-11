from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Existing authentication models
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

# New project models
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

class GetProjectsResponse(BaseModel):
    success: bool
    message: str
    projects: List[ProjectResponse]

class CreateProjectResponse(BaseModel):
    success: bool
    message: str
    project: ProjectResponse

# Generic response models
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None