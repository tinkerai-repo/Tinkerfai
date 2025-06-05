import React from "react";
import "./CreateProjectModal.css";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
          <button className="modal-btn beginner">Beginner</button>
          <button className="modal-btn expert">Expert</button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
