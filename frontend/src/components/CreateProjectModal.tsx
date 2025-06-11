import React, { useState } from "react";
import "./CreateProjectModal.css";
import { useNavigate } from "react-router-dom";
import {
  projectApi,
  Project,
  CreateProjectRequest,
} from "../services/projectApi";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: Project) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onProjectCreated,
}) => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTrackClick = async (track: "beginner" | "expert") => {
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    if (isCreating) return; // Prevent double-clicks

    try {
      setIsCreating(true);
      setError("");

      // Prepare project data
      const projectData: CreateProjectRequest = {
        projectName: projectName.trim(),
        projectType: track,
      };

      // Call API to create project
      const response = await projectApi.createProject(projectData);

      if (response.success) {
        // Notify parent component about the new project
        onProjectCreated(response.project);

        // Navigate to the project page with the generated ID
        navigate(`/project/${response.project.projectId}`);

        // Reset form
        setProjectName("");
        setError("");
      } else {
        setError(response.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (error) setError("");
  };

  const handleClose = () => {
    if (!isCreating) {
      setProjectName("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button
          className="modal-close-btn"
          onClick={handleClose}
          disabled={isCreating}
        >
          &times;
        </button>
        <div className="modal-title">Create New Project</div>

        <div className="modal-input-group">
          <input
            type="text"
            className="modal-input"
            placeholder="Enter project name"
            value={projectName}
            onChange={handleProjectNameChange}
            disabled={isCreating}
            maxLength={100}
          />
          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-subtitle">
          What project track do you want to work on:
        </div>
        <div className="modal-btn-group">
          <button
            className={`modal-btn beginner ${isCreating ? "creating" : ""}`}
            onClick={() => handleTrackClick("beginner")}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Beginner"}
          </button>
          <button
            className={`modal-btn expert ${isCreating ? "creating" : ""}`}
            onClick={() => handleTrackClick("expert")}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Expert"}
          </button>
        </div>

        {isCreating && (
          <div className="modal-loading">
            <div className="modal-spinner"></div>
            <span>Creating your project...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProjectModal;
