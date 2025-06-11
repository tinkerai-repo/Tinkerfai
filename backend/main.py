from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import (
    SignupRequest, SigninRequest, TokenValidateRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    ConfirmSignupRequest, ResendConfirmationRequest,
    CreateProjectRequest, CreateProjectResponse, GetProjectsResponse,
    SuccessResponse, ErrorResponse
)
from services.cognito import cognito_service
from services.project import project_service
from dependencies import get_current_user_email

# Create FastAPI application
app = FastAPI(
    title="Tinkerfai Authentication API with Cognito",
    description="Backend API for Tinkerfai user authentication using AWS Cognito",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Tinkerfai Authentication API with Cognito is running!"}

# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/api/signup", response_model=SuccessResponse)
async def signup(request: SignupRequest):
    """
    Register a new user with AWS Cognito
    """
    try:
        # Validate input
        if request.password != request.confirmPassword:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        if len(request.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Create user with Cognito
        result = cognito_service.sign_up(
            request.email, 
            request.password, 
            request.firstName, 
            request.lastName
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message="Account created successfully! You can now sign in.",
            data={"email": request.email}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/signin", response_model=SuccessResponse)
async def signin(request: SigninRequest):
    """
    Sign in user with AWS Cognito
    """
    try:
        # Authenticate with Cognito
        result = cognito_service.sign_in(request.email, request.password)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message="Sign in successful",
            data={
                "accessToken": result["tokens"]["AccessToken"],
                "refreshToken": result["tokens"]["RefreshToken"],
                "idToken": result["tokens"]["IdToken"],
                "expiresIn": result["tokens"]["ExpiresIn"],
                "user": result["user"]
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signin error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/validate-token", response_model=SuccessResponse)
async def validate_token(request: TokenValidateRequest):
    """
    Validate access token with AWS Cognito
    """
    try:
        result = cognito_service.validate_token(request.accessToken)
        
        if not result["success"]:
            raise HTTPException(status_code=401, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message="Token is valid",
            data={"user": result["user"]}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/forgot-password", response_model=SuccessResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """
    Initiate password reset with AWS Cognito
    """
    try:
        result = cognito_service.forgot_password(request.email)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/reset-password", response_model=SuccessResponse)
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password with confirmation code from AWS Cognito
    """
    try:
        # Validate input
        if request.newPassword != request.confirmPassword:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        if len(request.newPassword) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Reset password with Cognito
        result = cognito_service.confirm_forgot_password(
            request.email,
            request.confirmationCode,
            request.newPassword
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message="Password reset successful. You can now sign in with your new password."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/confirm-signup", response_model=SuccessResponse)
async def confirm_signup(request: ConfirmSignupRequest):
    """
    Verify OTP code for signup confirmation
    """
    try:
        result = cognito_service.confirm_signup(request.email, request.confirmationCode)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Confirm signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/resend-confirmation", response_model=SuccessResponse)
async def resend_confirmation(request: ResendConfirmationRequest):
    """
    Resend OTP code for signup
    """
    try:
        result = cognito_service.resend_confirmation_code(request.email)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Resend confirmation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/logout", response_model=SuccessResponse)
async def logout(request: TokenValidateRequest):
    """
    Logout user by invalidating tokens
    """
    try:
        result = cognito_service.logout(request.accessToken)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== PROJECT ENDPOINTS ==========

@app.post("/api/projects", response_model=CreateProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    user_email: str = Depends(get_current_user_email)
):
    """
    Create a new project for the authenticated user
    """
    try:
        result = project_service.create_project(user_email, request)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return CreateProjectResponse(
            success=True,
            message=result["message"],
            project=result["project"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/projects", response_model=GetProjectsResponse)
async def get_projects(user_email: str = Depends(get_current_user_email)):
    """
    Get all projects for the authenticated user
    """
    try:
        result = project_service.get_user_projects(user_email)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return GetProjectsResponse(
            success=True,
            message=result["message"],
            projects=result["projects"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get projects error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    user_email: str = Depends(get_current_user_email)
):
    """
    Get a specific project for the authenticated user
    """
    try:
        result = project_service.get_project(user_email, project_id)
        
        if not result["success"]:
            if "not found" in result["message"].lower():
                raise HTTPException(status_code=404, detail=result["message"])
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"],
            data={"project": result["project"]}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    user_email: str = Depends(get_current_user_email)
):
    """
    Delete a specific project for the authenticated user
    """
    try:
        result = project_service.delete_project(user_email, project_id)
        
        if not result["success"]:
            if "not found" in result["message"].lower():
                raise HTTPException(status_code=404, detail=result["message"])
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== TEST ENDPOINTS ==========

@app.get("/api/test-cognito")
async def test_cognito():
    """Test Cognito connection"""
    try:
        # Test connection by describing user pool
        response = cognito_service.client.describe_user_pool(
            UserPoolId=cognito_service.user_pool_id
        )
        return {
            "success": True,
            "user_pool_name": response['UserPool']['Name'],
            "user_pool_id": response['UserPool']['Id']
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/test-dynamodb")
async def test_dynamodb():
    """Test DynamoDB connection"""
    try:
        from services.dynamodb import dynamodb_service
        # Test by describing the table
        table_description = dynamodb_service.table.meta.client.describe_table(
            TableName=dynamodb_service.table_name
        )
        return {
            "success": True,
            "table_name": table_description['Table']['TableName'],
            "table_status": table_description['Table']['TableStatus']
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)