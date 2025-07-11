from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from models import (
    SignupRequest, SigninRequest, TokenValidateRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    ConfirmSignupRequest, ResendConfirmationRequest,
    CreateProjectRequest, CreateProjectResponse, GetProjectsResponse,
    SuccessResponse, ErrorResponse, QuestionRequest, AnswerSubmissionRequest,
    FileUploadRequest, FileUploadResponse, FileValidationResponse
)
from services.cognito import cognito_service
from services.project import project_service
from services.question import question_service
from services.s3 import s3_service
from dependencies import get_current_user_email
import logging

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Tinkerfai AI-Powered Learning API",
    description="Backend API for Tinkerfai AI-powered data science learning platform",
    version="3.0.0"
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
    return {"message": "Tinkerfai AI-Powered Learning API is running!"}

# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/api/signup", response_model=SuccessResponse)
async def signup(request: SignupRequest):
    """Register a new user with AWS Cognito"""
    try:
        if request.password != request.confirmPassword:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        if len(request.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
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
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/signin", response_model=SuccessResponse)
async def signin(request: SigninRequest):
    """Sign in user with AWS Cognito"""
    try:
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
        logger.error(f"Signin error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/validate-token", response_model=SuccessResponse)
async def validate_token(request: TokenValidateRequest):
    """Validate access token with AWS Cognito"""
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
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/forgot-password", response_model=SuccessResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Initiate password reset with AWS Cognito"""
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
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/reset-password", response_model=SuccessResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password with confirmation code from AWS Cognito"""
    try:
        if request.newPassword != request.confirmPassword:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        if len(request.newPassword) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
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
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/confirm-signup", response_model=SuccessResponse)
async def confirm_signup(request: ConfirmSignupRequest):
    """Verify OTP code for signup confirmation"""
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
        logger.error(f"Confirm signup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/resend-confirmation", response_model=SuccessResponse)
async def resend_confirmation(request: ResendConfirmationRequest):
    """Resend OTP code for signup"""
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
        logger.error(f"Resend confirmation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/logout", response_model=SuccessResponse)
async def logout(request: TokenValidateRequest):
    """Logout user by invalidating tokens"""
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
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== PROJECT ENDPOINTS ==========

@app.post("/api/projects", response_model=CreateProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    user_email: str = Depends(get_current_user_email)
):
    """Create a new project for the authenticated user"""
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
        logger.error(f"Create project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/projects", response_model=GetProjectsResponse)
async def get_projects(user_email: str = Depends(get_current_user_email)):
    """Get all projects for the authenticated user"""
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
        logger.error(f"Get projects error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    user_email: str = Depends(get_current_user_email)
):
    """Get a specific project for the authenticated user"""
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
        logger.error(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    user_email: str = Depends(get_current_user_email)
):
    """Delete a specific project for the authenticated user"""
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
        logger.error(f"Delete project error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== QUESTION & ANSWER ENDPOINTS ==========

@app.get("/api/projects/{project_id}/questions/{task_index}/{subtask_index}")
async def get_question(
    project_id: str,
    task_index: int,
    subtask_index: int,
    user_email: str = Depends(get_current_user_email)
):
    """Get or generate a question for a specific task/subtask"""
    try:
        result = question_service.get_or_generate_question(
            user_email, project_id, task_index, subtask_index
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message="Question retrieved successfully",
            data={
                "question": result["question"].model_dump(),
                "existingAnswer": result.get("existingAnswer").dict() if result.get("existingAnswer") else None,
                "datasetSummary": result.get("datasetSummary")
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get question error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/projects/{project_id}/answers")
async def submit_answer(
    project_id: str,
    request: AnswerSubmissionRequest,
    user_email: str = Depends(get_current_user_email)
):
    """Submit an answer for a question"""
    try:
        # Validate that the project belongs to the user
        if request.userEmail != user_email or request.projectId != project_id:
            raise HTTPException(status_code=403, detail="Invalid project access")
        
        result = question_service.submit_answer(
            user_email=user_email,
            project_id=project_id,
            task_index=request.taskIndex,
            subtask_index=request.subtaskIndex,
            question_id=request.questionId,
            answer_data={
                "answerType": request.answerType.value,
                "textAnswer": request.textAnswer,
                "selectedOption": request.selectedOption,
                "fileName": request.fileName,
                "fileUrl": request.fileUrl
            }
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return SuccessResponse(
            success=True,
            message=result["message"],
            data=result.get("data")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Submit answer error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/projects/{project_id}/progress")
async def get_progress(
    project_id: str,
    user_email: str = Depends(get_current_user_email)
):
    """Get user progress for a project"""
    try:
        # Get all answers for the project
        from services.dynamodb import dynamodb_service
        result = dynamodb_service.get_project_answers(user_email, project_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        answers = result["answers"]
        
        # Calculate progress
        completed_tasks = set()
        completed_subtasks = {}
        current_task = 1
        current_subtask = 0
        
        for answer in answers:
            task_idx = answer["taskIndex"]
            subtask_idx = answer["subtaskIndex"]
            
            if task_idx not in completed_subtasks:
                completed_subtasks[task_idx] = []
            
            completed_subtasks[task_idx].append(subtask_idx)
            
            # Update current position
            if task_idx > current_task or (task_idx == current_task and subtask_idx >= current_subtask):
                current_task = task_idx
                current_subtask = subtask_idx + 1
        
        # Determine completed tasks
        for task_idx, subtasks in completed_subtasks.items():
            if task_idx == 1 and 0 in subtasks:  # Task 1 has only 1 subtask
                completed_tasks.add(task_idx)
            elif task_idx == 2 and len(subtasks) >= 4:  # Task 2 has 4 subtasks
                completed_tasks.add(task_idx)
        
        return SuccessResponse(
            success=True,
            message="Progress retrieved successfully",
            data={
                "currentTask": current_task,
                "currentSubtask": current_subtask,
                "completedTasks": list(completed_tasks),
                "completedSubtasks": completed_subtasks,
                "totalAnswers": len(answers)
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get progress error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== FILE UPLOAD ENDPOINTS ==========

@app.post("/api/projects/{project_id}/upload-url")
async def get_upload_url(
    project_id: str,
    task_index: int = Form(...),
    subtask_index: int = Form(...),
    file_name: str = Form(...),
    user_email: str = Depends(get_current_user_email)
):
    """Get presigned URL for file upload"""
    try:
        result = s3_service.generate_presigned_upload_url(
            user_email, project_id, task_index, subtask_index, file_name
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return FileUploadResponse(
            success=True,
            message=result["message"],
            uploadUrl=result["upload_url"],
            fileKey=result["file_key"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get upload URL error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/projects/{project_id}/validate-file")
async def validate_file(
    project_id: str,
    file_key: str = Form(...),
    user_email: str = Depends(get_current_user_email)
):
    """Validate uploaded CSV file"""
    try:
        # Validate and process CSV
        is_valid, message, csv_data = s3_service.validate_and_process_csv(file_key)
        
        if not is_valid:
            return FileValidationResponse(
                success=False,
                message=message,
                isValid=False
            )
        
        # Get project context for AI validation
        from services.dynamodb import dynamodb_service
        project_result = dynamodb_service.get_project(user_email, project_id)
        
        if project_result["success"]:
            context = project_result["project"].get("context_for_LLM", "")
            
            # AI validation
            from services.openai import openai_service
            ai_is_valid, ai_message = openai_service.validate_csv_content(csv_data, context)
            
            if not ai_is_valid:
                return FileValidationResponse(
                    success=False,
                    message=ai_message,
                    isValid=False
                )
        
        return FileValidationResponse(
            success=True,
            message="File validation successful",
            isValid=True,
            validationDetails={
                "rowCount": len(csv_data),
                "columnCount": len(csv_data[0].keys()) if csv_data else 0,
                "columns": list(csv_data[0].keys()) if csv_data else []
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validate file error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========== TEST ENDPOINTS ==========

@app.get("/api/test-cognito")
async def test_cognito():
    """Test Cognito connection"""
    try:
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

@app.get("/api/test-s3")
async def test_s3():
    """Test S3 connection"""
    try:
        from services.s3 import s3_service
        response = s3_service.s3_client.list_objects_v2(
            Bucket=s3_service.bucket_name,
            MaxKeys=1
        )
        return {
            "success": True,
            "bucket_name": s3_service.bucket_name,
            "accessible": True
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/test-openai")
async def test_openai():
    """Test OpenAI connection"""
    try:
        from services.openai import openai_service
        response = openai_service._make_api_call([
            {"role": "user", "content": "Say 'test successful' if you can read this."}
        ])
        return {
            "success": True,
            "response": response
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/test-projects-no-auth")
async def test_projects_no_auth():
    """Test projects endpoint without authentication"""
    try:
        from services.dynamodb import dynamodb_service
        result = dynamodb_service.get_user_projects("test@example.com")
        return {
            "success": True,
            "db_result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)