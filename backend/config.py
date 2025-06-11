from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # AWS Credentials
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-2"
    
    # AWS Cognito Configuration
    cognito_user_pool_id: str
    cognito_app_client_id: str
    
    # DynamoDB Configuration
    dynamodb_table_name: str = "tinkerfai-user-projects"
    
    class Config:
        env_file = ".env"

settings = Settings()