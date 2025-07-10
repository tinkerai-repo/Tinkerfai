import boto3
from botocore.exceptions import ClientError
from config import settings
from typing import Dict, List, Any, Optional, Tuple
import logging
import pandas as pd
import io
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name = settings.s3_bucket_name
        self.max_file_size = 5 * 1024 * 1024  # 5MB in bytes
        
        # Ensure bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create S3 bucket if it doesn't exist"""
        try:
            # Check if bucket exists
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 bucket {self.bucket_name} exists")
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                # Bucket doesn't exist, create it
                try:
                    if settings.aws_region == 'us-east-1':
                        self.s3_client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={'LocationConstraint': settings.aws_region}
                        )
                    logger.info(f"Created S3 bucket: {self.bucket_name}")
                except ClientError as create_error:
                    logger.error(f"Failed to create S3 bucket: {create_error}")
                    raise
            else:
                logger.error(f"Error checking S3 bucket: {e}")
                raise

    def generate_presigned_upload_url(self, user_email: str, project_id: str, 
                                    task_index: int, subtask_index: int, 
                                    file_name: str) -> Dict[str, Any]:
        """Generate presigned URL for file upload"""
        try:
            # Validate file extension
            if not file_name.lower().endswith('.csv'):
                return {
                    "success": False,
                    "message": "Only CSV files are allowed"
                }

            # Generate unique file key
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_key = f"projects/{user_email}/{project_id}/task_{task_index}_subtask_{subtask_index}_{timestamp}_{file_name}"

            # Generate presigned URL for PUT operation
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key,
                    'ContentType': 'text/csv'
                },
                ExpiresIn=3600,  # 1 hour
                HttpMethod='PUT'
            )

            return {
                "success": True,
                "upload_url": presigned_url,
                "file_key": file_key,
                "message": "Upload URL generated successfully"
            }

        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return {
                "success": False,
                "message": f"Failed to generate upload URL: {str(e)}"
            }

    def validate_and_process_csv(self, file_key: str) -> Tuple[bool, str, Optional[List[Dict[str, Any]]]]:
        """Download and validate CSV file, return sample data"""
        try:
            # Download file from S3
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
            file_content = response['Body'].read()

            # Check file size
            if len(file_content) > self.max_file_size:
                return False, "File size exceeds 5MB limit", None

            # Try to read as CSV
            try:
                # Decode content
                csv_string = file_content.decode('utf-8')
                
                # Read with pandas
                df = pd.read_csv(io.StringIO(csv_string))
                
                # Basic validation
                if df.empty:
                    return False, "CSV file is empty", None
                
                if len(df.columns) < 2:
                    return False, "CSV must have at least 2 columns", None
                
                # Check for reasonable number of rows
                if len(df) < 5:
                    return False, "CSV must have at least 5 rows of data", None

                # Get sample data (first 50 rows)
                sample_df = df.head(50)
                
                # Convert to list of dictionaries
                sample_data = sample_df.to_dict('records')
                
                return True, "CSV validation successful", sample_data

            except pd.errors.EmptyDataError:
                return False, "CSV file is empty or invalid", None
            except pd.errors.ParserError as e:
                return False, f"CSV parsing error: {str(e)}", None
            except UnicodeDecodeError:
                return False, "File encoding not supported. Please use UTF-8 encoded CSV", None

        except ClientError as e:
            logger.error(f"Error processing CSV from S3: {e}")
            return False, f"Failed to process file: {str(e)}", None
        except Exception as e:
            logger.error(f"Unexpected error processing CSV: {e}")
            return False, f"Unexpected error: {str(e)}", None

    def get_dataset_summary(self, file_key: str) -> Optional[Dict[str, Any]]:
        """Generate comprehensive dataset summary"""
        try:
            # Download and read CSV
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
            file_content = response['Body'].read()
            csv_string = file_content.decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_string))

            # Generate summary
            summary = {
                "rowCount": len(df),
                "columnCount": len(df.columns),
                "columns": [],
                "missingValues": {},
                "dataPreview": df.head(5).to_dict('records')
            }

            # Analyze each column
            for col in df.columns:
                col_info = {
                    "name": col,
                    "type": str(df[col].dtype),
                    "unique_values": int(df[col].nunique()),
                    "missing_count": int(df[col].isnull().sum())
                }
                
                # Determine semantic type
                if pd.api.types.is_numeric_dtype(df[col]):
                    if df[col].nunique() < 10 and df[col].dtype in ['int64', 'int32']:
                        col_info["semantic_type"] = "categorical_numeric"
                    else:
                        col_info["semantic_type"] = "numeric"
                    # Add mean for numeric columns
                    col_info["mean"] = float(df[col].mean()) if df[col].notnull().any() else None
                elif pd.api.types.is_datetime64_any_dtype(df[col]):
                    col_info["semantic_type"] = "datetime"
                    col_info["mode"] = str(df[col].mode().iloc[0]) if not df[col].mode().empty else None
                else:
                    if df[col].nunique() < len(df) * 0.5:  # Less than 50% unique values
                        col_info["semantic_type"] = "categorical"
                    else:
                        col_info["semantic_type"] = "text"
                    # Add mode for non-numeric columns
                    col_info["mode"] = str(df[col].mode().iloc[0]) if not df[col].mode().empty else None

                summary["columns"].append(col_info)
                summary["missingValues"][col] = int(df[col].isnull().sum())

            return summary

        except Exception as e:
            logger.error(f"Error generating dataset summary: {e}")
            return None

    def get_file_url(self, file_key: str) -> str:
        """Generate presigned URL for file download"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=3600  # 1 hour
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating download URL: {e}")
            return ""

    def delete_file(self, file_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError as e:
            logger.error(f"Error deleting file from S3: {e}")
            return False

    def cleanup_old_files(self, user_email: str, project_id: str, days_old: int = 30):
        """Clean up old files for a project"""
        try:
            prefix = f"projects/{user_email}/{project_id}/"
            
            # List objects with prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )

            if 'Contents' not in response:
                return

            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=days_old)

            # Delete old files
            objects_to_delete = []
            for obj in response['Contents']:
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    objects_to_delete.append({'Key': obj['Key']})

            if objects_to_delete:
                self.s3_client.delete_objects(
                    Bucket=self.bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                logger.info(f"Cleaned up {len(objects_to_delete)} old files for project {project_id}")

        except ClientError as e:
            logger.error(f"Error cleaning up old files: {e}")

# Global instance
s3_service = S3Service()