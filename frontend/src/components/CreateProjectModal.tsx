import React, { useState } from "react";
import "./CreateProjectModal.css";
import { useNavigate } from "react-router-dom";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTrackClick = (track: "beginner" | "expert") => {
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }
    // Here you can save the project name and track to your state management or backend
    onClose();
    navigate("/project");
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>
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
          />
          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-subtitle">
          What project track do you want to work on:
        </div>
        <div className="modal-btn-group">
          <button
            className="modal-btn beginner"
            onClick={() => handleTrackClick("beginner")}
          >
            Beginner
          </button>
          <button
            className="modal-btn expert"
            onClick={() => handleTrackClick("expert")}
          >
            Expert
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
