import React from "react";
import "./SubmitButton.css";

interface SubmitButtonProps {
  onClick: () => void;
  position: "left" | "right" | "center";
  taskIndex: number;
  subtaskIndex: number;
  disabled?: boolean;
  loading?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  position,
  taskIndex,
  subtaskIndex,
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      id={`submit-task${taskIndex + 1}-subtask${subtaskIndex + 1}`}
      className={`submit-button ${position} ${disabled ? "disabled" : ""} ${
        loading ? "loading" : ""
      }`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="submit-loading">
          <div className="loading-spinner-small"></div>
          <span>Submitting...</span>
        </div>
      ) : (
        "Submit"
      )}
    </button>
  );
};

export default SubmitButton;
