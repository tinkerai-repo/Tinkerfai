import React from "react";
import "./SubmitButton.css";

interface SubmitButtonProps {
  onClick: () => void;
  position: "left" | "right";
  taskIndex: number;
  subtaskIndex: number;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  position,
  taskIndex,
  subtaskIndex,
}) => {
  return (
    <button
      id={`submit-task${taskIndex + 1}-subtask${subtaskIndex + 1}`}
      className={`submit-button ${position}`}
      onClick={onClick}
    >
      Submit
    </button>
  );
};

export default SubmitButton;
