import React from "react";
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
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTrackClick = () => {
    onClose();
    navigate("/project");
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="modal-title">
          What project track do you want to work on:
        </div>
        <div className="modal-btn-group">
          <button className="modal-btn beginner" onClick={handleTrackClick}>
            Beginner
          </button>
          <button className="modal-btn expert" onClick={handleTrackClick}>
            Expert
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
