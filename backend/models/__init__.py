from pydantic import BaseModel, EmailStr
from typing import Optional

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

class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None