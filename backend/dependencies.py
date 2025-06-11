from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.cognito import cognito_service
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """
    Dependency to validate JWT token and extract user information
    """
    try:
        # Extract the token from Authorization header
        token = credentials.credentials
        
        # Validate token with Cognito
        result = cognito_service.validate_token(token)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return user information
        user_info = result["user"]
        
        # Ensure we have required fields
        if not user_info.get("email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user email",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Authenticated user: {user_info['email']}")
        return user_info
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_email(current_user: Dict = Depends(get_current_user)) -> str:
    """
    Convenience dependency to extract just the email from the current user
    """
    return current_user["email"]