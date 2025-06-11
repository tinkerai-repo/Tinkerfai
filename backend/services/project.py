from nanoid import generate
from services.dynamodb import dynamodb_service
from models import ProjectResponse, CreateProjectRequest
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ProjectService:
    def __init__(self):
        self.db = dynamodb_service

    def generate_project_id(self) -> str:
        """Generate a unique project ID using nanoid"""
        # Generate URL-safe ID with 12 characters (similar to your example: cdwvsref4FVDSvd)
        return generate(size=12)

    def create_project(self, user_email: str, project_data: CreateProjectRequest) -> Dict:
        """Create a new project for a user"""
        try:
            # Validate project type
            if project_data.projectType not in ['beginner', 'expert']:
                return {
                    "success": False,
                    "message": "Project type must be 'beginner' or 'expert'"
                }

            # Validate project name
            project_name = project_data.projectName.strip()
            if not project_name:
                return {
                    "success": False,
                    "message": "Project name cannot be empty"
                }

            if len(project_name) > 100:
                return {
                    "success": False,
                    "message": "Project name cannot exceed 100 characters"
                }

            # Generate unique project ID
            project_id = self.generate_project_id()
            
            # Create project in database
            result = self.db.create_project(
                user_email=user_email,
                project_id=project_id,
                project_name=project_name,
                project_type=project_data.projectType
            )

            if not result["success"]:
                # If ID collision (very rare), try once more
                if "already exists" in result.get("message", ""):
                    project_id = self.generate_project_id()
                    result = self.db.create_project(
                        user_email=user_email,
                        project_id=project_id,
                        project_name=project_name,
                        project_type=project_data.projectType
                    )

            if result["success"]:
                # Convert to response model
                project_response = ProjectResponse(
                    projectId=result["project"]["projectId"],
                    projectName=result["project"]["projectName"],
                    projectType=result["project"]["projectType"],
                    createdAt=result["project"]["createdAt"],
                    updatedAt=result["project"]["updatedAt"],
                    userEmail=result["project"]["userEmail"]
                )

                return {
                    "success": True,
                    "message": "Project created successfully",
                    "project": project_response
                }

            return result

        except Exception as e:
            logger.error(f"Error in create_project service: {e}")
            return {
                "success": False,
                "message": "Failed to create project due to internal error"
            }

    def get_user_projects(self, user_email: str) -> Dict:
        """Get all projects for a user"""
        try:
            result = self.db.get_user_projects(user_email)

            if not result["success"]:
                return result

            # Convert to response models
            projects = []
            for project_data in result["projects"]:
                project_response = ProjectResponse(
                    projectId=project_data["projectId"],
                    projectName=project_data["projectName"],
                    projectType=project_data["projectType"],
                    createdAt=project_data["createdAt"],
                    updatedAt=project_data["updatedAt"],
                    userEmail=project_data["userEmail"]
                )
                projects.append(project_response)

            return {
                "success": True,
                "message": f"Retrieved {len(projects)} projects",
                "projects": projects
            }

        except Exception as e:
            logger.error(f"Error in get_user_projects service: {e}")
            return {
                "success": False,
                "message": "Failed to retrieve projects due to internal error"
            }

    def get_project(self, user_email: str, project_id: str) -> Dict:
        """Get a specific project"""
        try:
            result = self.db.get_project(user_email, project_id)

            if not result["success"]:
                return result

            # Convert to response model
            project_response = ProjectResponse(
                projectId=result["project"]["projectId"],
                projectName=result["project"]["projectName"],
                projectType=result["project"]["projectType"],
                createdAt=result["project"]["createdAt"],
                updatedAt=result["project"]["updatedAt"],
                userEmail=result["project"]["userEmail"]
            )

            return {
                "success": True,
                "message": "Project retrieved successfully",
                "project": project_response
            }

        except Exception as e:
            logger.error(f"Error in get_project service: {e}")
            return {
                "success": False,
                "message": "Failed to retrieve project due to internal error"
            }

    def update_project(self, user_email: str, project_id: str, updates: Dict) -> Dict:
        """Update a project"""
        try:
            # Validate updates
            allowed_fields = ['projectName', 'projectType']
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

            if not filtered_updates:
                return {
                    "success": False,
                    "message": "No valid fields to update"
                }

            # Validate project type if being updated
            if 'projectType' in filtered_updates:
                if filtered_updates['projectType'] not in ['beginner', 'expert']:
                    return {
                        "success": False,
                        "message": "Project type must be 'beginner' or 'expert'"
                    }

            # Validate project name if being updated
            if 'projectName' in filtered_updates:
                project_name = filtered_updates['projectName'].strip()
                if not project_name:
                    return {
                        "success": False,
                        "message": "Project name cannot be empty"
                    }
                if len(project_name) > 100:
                    return {
                        "success": False,
                        "message": "Project name cannot exceed 100 characters"
                    }
                filtered_updates['projectName'] = project_name

            result = self.db.update_project(user_email, project_id, filtered_updates)

            if result["success"]:
                # Convert to response model
                project_response = ProjectResponse(
                    projectId=result["project"]["projectId"],
                    projectName=result["project"]["projectName"],
                    projectType=result["project"]["projectType"],
                    createdAt=result["project"]["createdAt"],
                    updatedAt=result["project"]["updatedAt"],
                    userEmail=result["project"]["userEmail"]
                )

                return {
                    "success": True,
                    "message": "Project updated successfully",
                    "project": project_response
                }

            return result

        except Exception as e:
            logger.error(f"Error in update_project service: {e}")
            return {
                "success": False,
                "message": "Failed to update project due to internal error"
            }

    def delete_project(self, user_email: str, project_id: str) -> Dict:
        """Delete a project"""
        try:
            result = self.db.delete_project(user_email, project_id)
            return result

        except Exception as e:
            logger.error(f"Error in delete_project service: {e}")
            return {
                "success": False,
                "message": "Failed to delete project due to internal error"
            }

# Global instance
project_service = ProjectService()