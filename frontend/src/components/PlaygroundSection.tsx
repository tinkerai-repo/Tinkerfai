import React, { useState } from "react";
import "./PlaygroundSection.css";
import PuzzlePiece from "./PuzzlePiece";
import SubmitButton from "./SubmitButton";

export type PuzzlePieceType =
  | "subtask-1"
  | "subtask-2"
  | "subtask-3"
  | "subtask-4";

const TASK_COLORS = [
  // Pink (First task - no subtasks)
  ["#FF6B6B", "#FF6B6B", "#FF6B6B", "#FF6B6B"],
  // Blue-Green
  ["#11999E", "#6FE7DD", "#6FE7DD", "#11999E"],
  // Yellow
  ["#FFD166", "#FFE299", "#FFE299", "#FFD166"],
  // Purple
  ["#6A4C93", "#A084CA", "#A084CA", "#6A4C93"],
  // Orange
  ["#FF9F1C", "#FFB347", "#FFB347", "#FF9F1C"],
];

const SUBTASK_TYPES: PuzzlePieceType[] = [
  "subtask-1",
  "subtask-2",
  "subtask-3",
  "subtask-4",
];

interface PlaygroundSectionProps {
  selectedTaskIndex: number | null;
  currentSubtaskIndex: number;
  onSubtaskClick: (subtaskIndex: number) => void;
  completedSubtasks: boolean[][];
  children?: React.ReactNode;
}

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({
  selectedTaskIndex,
  currentSubtaskIndex,
  onSubtaskClick,
  children,
}) => {
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [isSubtaskSelected, setIsSubtaskSelected] = useState(false);
  const [isOffsetApplied, setIsOffsetApplied] = useState(false);

  if (selectedTaskIndex === null) {
    return (
      <div
        className="playground-section"
        style={{ paddingTop: `33vh`, height: "100%" }}
      >
        {children}
      </div>
    );
  }

  // Special handling for first task (no subtasks)
  if (selectedTaskIndex === 0) {
    return (
      <div
        className="playground-section"
        style={{ paddingTop: `33vh`, height: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <SubmitButton
            onClick={() => onSubtaskClick(0)}
            position="left"
            taskIndex={0}
            subtaskIndex={0}
          />
        </div>
        {children}
      </div>
    );
  }

  const colors = TASK_COLORS[selectedTaskIndex];

  const isSubtaskClickable = (index: number) => {
    if (showSubmitButton) return false;
    return index === currentSubtaskIndex;
  };

  const getShiftDirection = () => {
    if (!isSubtaskSelected) return null;
    if (currentSubtaskIndex === 0 || currentSubtaskIndex === 2) return "right";
    if (currentSubtaskIndex === 1 || currentSubtaskIndex === 3) return "left";
    return null;
  };

  const handleSubtaskClick = (index: number) => {
    if (isSubtaskClickable(index)) {
      setIsSubtaskSelected(true);
      setShowSubmitButton(true);
      setTimeout(() => setIsOffsetApplied(true), 500);
    }
  };

  const handleSubmit = () => {
    setShowSubmitButton(false);
    setIsSubtaskSelected(false);
    setIsOffsetApplied(false);
    onSubtaskClick(currentSubtaskIndex);
  };

  const shiftDirection = getShiftDirection();
  const shouldShowSeparator = selectedTaskIndex !== null && isSubtaskSelected;

  return (
    <div
      className="playground-section"
      style={{ height: "100%", position: "relative" }}
    >
      <div className="puzzle-area-wrapper">
        {shouldShowSeparator && <div className="vertical-separator" />}
        <div
          className={`puzzle-blocks-container${
            shiftDirection ? ` shift-${shiftDirection}` : ""
          }`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: "0",
            width: "38.7vh",
            height: "38.7vh",
            placeItems: "center",
            transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            transform:
              shiftDirection === "right"
                ? "translateX(128%)"
                : shiftDirection === "left"
                ? "translateX(-128%)"
                : "none",
          }}
        >
          {SUBTASK_TYPES.map((type, i) => {
            let zIndex = i === 0 || i === 3 ? 2 : 1;
            if (currentSubtaskIndex === 1 || currentSubtaskIndex === 2) {
              zIndex = i === 1 || i === 2 ? 2 : 1;
            }
            // Calculate extra offset for the selected subtask only, when shifted
            let extraTransform = "";
            if (
              isOffsetApplied &&
              isSubtaskSelected &&
              i === currentSubtaskIndex &&
              ((shiftDirection === "right" &&
                (currentSubtaskIndex === 0 || currentSubtaskIndex === 2)) ||
                (shiftDirection === "left" &&
                  (currentSubtaskIndex === 1 || currentSubtaskIndex === 3)))
            ) {
              if (currentSubtaskIndex === 0) {
                extraTransform = " translateY(-25%) translateX(-30%)"; // subtask1: up & left
              } else if (currentSubtaskIndex === 1) {
                extraTransform = " translateY(-25%) translateX(30%)"; // subtask2: up & right
              } else if (currentSubtaskIndex === 2) {
                extraTransform = " translateY(30%) translateX(-30%)"; // subtask3: down & left
              } else if (currentSubtaskIndex === 3) {
                extraTransform = " translateY(30%) translateX(30%)"; // subtask4: down & right
              }
            }
            // Compose the base transform for each piece
            let baseTransform = "";
            if (i === 0) {
              baseTransform = "translateY(8.6vh) translateX(10.7%)";
            } else if (i === 1) {
              baseTransform = "translateX(-11.5%) translateY(8.6vh)";
            } else if (i === 2) {
              baseTransform = "translateX(10.7%)";
            } else if (i === 3) {
              baseTransform = "translateX(-11.5%)";
            }
            // Add margin for i === 0 and i === 3 as before
            const marginLeft = i === 0 ? "22%" : i === 3 ? "-22%" : undefined;
            const marginTop = i === 0 || i === 2 ? "4.3vh" : undefined;
            return (
              <div
                key={`task${selectedTaskIndex + 1}subtask${i + 1}`}
                style={{
                  position: "relative",
                  zIndex,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: isSubtaskClickable(i) ? "auto" : "none",
                  marginLeft,
                  marginTop,
                  transform: baseTransform + extraTransform,
                  transition: `transform 0.5s cubic-bezier(0.4,0,0.2,1)`,
                }}
                onClick={() => handleSubtaskClick(i)}
              >
                <PuzzlePiece
                  type={type}
                  color={colors[i]}
                  height={i === 0 || i === 3 ? "19.35vh" : "15vh"}
                  className={
                    i === currentSubtaskIndex ? "puzzle-piece-hoverable" : ""
                  }
                />
              </div>
            );
          })}
        </div>
        {showSubmitButton && (
          <SubmitButton
            onClick={handleSubmit}
            position={
              currentSubtaskIndex === 0 || currentSubtaskIndex === 2
                ? "left"
                : "right"
            }
            taskIndex={selectedTaskIndex}
            subtaskIndex={currentSubtaskIndex}
          />
        )}
      </div>
      {children}
    </div>
  );
};

export default PlaygroundSection;
