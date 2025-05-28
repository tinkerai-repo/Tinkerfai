import boto3
import hmac
import hashlib
import base64
from botocore.exceptions import ClientError
from config import settings

class CognitoService:
    def __init__(self):
        self.client = boto3.client(
            'cognito-idp',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.user_pool_id = settings.cognito_user_pool_id
        self.app_client_id = settings.cognito_app_client_id
        
        # Get client secret from Cognito
        self.client_secret = self._get_client_secret()

    def _get_client_secret(self):
        """Get the client secret from Cognito"""
        try:
            response = self.client.describe_user_pool_client(
                UserPoolId=self.user_pool_id,
                ClientId=self.app_client_id
            )
            return response['UserPoolClient'].get('ClientSecret')
        except Exception:
            return None

    def _calculate_secret_hash(self, username: str):
        """Calculate SECRET_HASH for Cognito"""
        if not self.client_secret:
            return None
        
        message = username + self.app_client_id
        dig = hmac.new(
            self.client_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

    def sign_up(self, email: str, password: str, first_name: str, last_name: str):
        """Register a new user with Cognito - sends OTP for verification"""
        try:
            auth_params = {
                'ClientId': self.app_client_id,
                'Username': email,
                'Password': password,
                'UserAttributes': [
                    {'Name': 'email', 'Value': email},
                    {'Name': 'given_name', 'Value': first_name},
                    {'Name': 'family_name', 'Value': last_name}
                ]
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                auth_params['SecretHash'] = secret_hash
            
            response = self.client.sign_up(**auth_params)
            
            # DON'T auto-confirm - let user verify with OTP
            return {
                "success": True,
                "message": "User registered successfully. Please check your email for verification code.",
                "user_sub": response['UserSub'],
                "confirmation_required": True
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'UsernameExistsException':
                return {
                    "success": False,
                    "message": "Email already registered"
                }
            return {
                "success": False,
                "message": f"Registration failed: {e.response['Error']['Message']}"
            }

    def confirm_signup(self, email: str, confirmation_code: str):
        """Verify OTP code for signup confirmation"""
        try:
            confirm_params = {
                'ClientId': self.app_client_id,
                'Username': email,
                'ConfirmationCode': confirmation_code
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                confirm_params['SecretHash'] = secret_hash
            
            self.client.confirm_sign_up(**confirm_params)
            
            return {
                "success": True,
                "message": "Account verified successfully! You can now sign in."
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'CodeMismatchException':
                return {
                    "success": False,
                    "message": "Invalid verification code"
                }
            elif error_code == 'ExpiredCodeException':
                return {
                    "success": False,
                    "message": "Verification code has expired"
                }
            return {
                "success": False,
                "message": f"Verification failed: {e.response['Error']['Message']}"
            }

    def resend_confirmation_code(self, email: str):
        """Resend OTP code for signup"""
        try:
            resend_params = {
                'ClientId': self.app_client_id,
                'Username': email
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                resend_params['SecretHash'] = secret_hash
            
            self.client.resend_confirmation_code(**resend_params)
            
            return {
                "success": True,
                "message": "Verification code resent to your email."
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"Failed to resend code: {e.response['Error']['Message']}"
            }

    def sign_in(self, email: str, password: str):
        """Sign in user with Cognito"""
        try:
            # First, check if user exists by trying to get user info
            try:
                self.client.admin_get_user(
                    UserPoolId=self.user_pool_id,
                    Username=email
                )
            except ClientError as user_check_error:
                if user_check_error.response['Error']['Code'] == 'UserNotFoundException':
                    return {
                        "success": False,
                        "message": "Email doesn't exist"
                    }
                # If it's some other error, continue with authentication attempt
            
            # User exists, now try to authenticate
            auth_params = {
                'USERNAME': email,
                'PASSWORD': password
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                auth_params['SECRET_HASH'] = secret_hash
            
            response = self.client.admin_initiate_auth(
                UserPoolId=self.user_pool_id,
                ClientId=self.app_client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters=auth_params
            )
            
            # Get user attributes
            user_response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=email
            )
            
            # Extract user info
            user_attributes = {}
            for attr in user_response['UserAttributes']:
                user_attributes[attr['Name']] = attr['Value']
            
            return {
                "success": True,
                "message": "Sign in successful",
                "tokens": response['AuthenticationResult'],
                "user": {
                    "email": user_attributes.get('email'),
                    "firstName": user_attributes.get('given_name'),
                    "lastName": user_attributes.get('family_name'),
                    "sub": user_attributes.get('sub')
                }
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            if error_code == 'NotAuthorizedException':
                # Check the specific message to distinguish between cases
                if 'password' in error_message.lower() or 'incorrect' in error_message.lower():
                    return {
                        "success": False,
                        "message": "Password incorrect"
                    }
                else:
                    return {
                        "success": False,
                        "message": "Password incorrect"
                    }
            elif error_code == 'UserNotConfirmedException':
                return {
                    "success": False,
                    "message": "Account not verified. Please check your email for verification code."
                }
            elif error_code == 'UserNotFoundException':
                return {
                    "success": False,
                    "message": "Email doesn't exist"
                }
            return {
                "success": False,
                "message": f"Sign in failed: {error_message}"
            }

    def validate_token(self, access_token: str):
        """Validate access token"""
        try:
            response = self.client.get_user(AccessToken=access_token)
            
            # Extract user info
            user_attributes = {}
            for attr in response['UserAttributes']:
                user_attributes[attr['Name']] = attr['Value']
            
            return {
                "success": True,
                "user": {
                    "email": user_attributes.get('email'),
                    "firstName": user_attributes.get('given_name'),
                    "lastName": user_attributes.get('family_name'),
                    "sub": user_attributes.get('sub')
                }
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"Token validation failed: {e.response['Error']['Message']}"
            }

    def forgot_password(self, email: str):
        """Initiate forgot password flow - sends OTP to email"""
        try:
            # First check if user exists
            try:
                self.client.admin_get_user(
                    UserPoolId=self.user_pool_id,
                    Username=email
                )
            except ClientError as user_check_error:
                if user_check_error.response['Error']['Code'] == 'UserNotFoundException':
                    return {
                        "success": False,
                        "message": "Email doesn't exist in our system"
                    }
                # If it's some other error, continue with password reset attempt
            
            # User exists, now send password reset code
            forgot_params = {
                'ClientId': self.app_client_id,
                'Username': email
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                forgot_params['SecretHash'] = secret_hash
            
            self.client.forgot_password(**forgot_params)
            
            return {
                "success": True,
                "message": "Password reset code sent to your email."
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'UserNotFoundException':
                return {
                    "success": False,
                    "message": "Email doesn't exist in our system"
                }
            elif error_code == 'InvalidParameterException':
                return {
                    "success": False,
                    "message": "Invalid email format"
                }
            return {
                "success": False,
                "message": f"Failed to send reset code: {e.response['Error']['Message']}"
            }

    def confirm_forgot_password(self, email: str, confirmation_code: str, new_password: str):
        """Confirm forgot password with code"""
        try:
            confirm_params = {
                'ClientId': self.app_client_id,
                'Username': email,
                'ConfirmationCode': confirmation_code,
                'Password': new_password
            }
            
            # Add SECRET_HASH if client has a secret
            secret_hash = self._calculate_secret_hash(email)
            if secret_hash:
                confirm_params['SecretHash'] = secret_hash
            
            self.client.confirm_forgot_password(**confirm_params)
            
            return {
                "success": True,
                "message": "Password reset successful"
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"Password reset failed: {e.response['Error']['Message']}"
            }

    def logout(self, access_token: str):
        """Logout user by invalidating token"""
        try:
            # Validate token first
            validation_result = self.validate_token(access_token)
            if not validation_result["success"]:
                return {
                    "success": False,
                    "message": "Invalid token"
                }
            
            # Global sign out (invalidates all tokens for this user)
            self.client.global_sign_out(AccessToken=access_token)
            
            return {
                "success": True,
                "message": "Logged out successfully"
            }
        except ClientError as e:
            return {
                "success": False,
                "message": f"Logout failed: {e.response['Error']['Message']}"
            }

# Global instance
cognito_service = CognitoService()