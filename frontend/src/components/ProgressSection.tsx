import React, { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import "./ProgressSection.css";
import PuzzlePiece from "./PuzzlePiece";
import PuzzleSplittedTask from "./PuzzleSplittedTask";
import LockIcon from "./LockIcon";

interface PuzzlePieceData {
  type: string;
  color: string;
  height: string;
}

interface ProgressSectionProps {
  heightPercent: number;
  onHeightChange: (percent: number) => void;
  onPuzzleClick?: (taskIndex: number) => void;
  selectedTaskIndex: number | null;
  completedSubtasks: boolean[][];
  unlockedIndex: number;
  children?: React.ReactNode;
}

const PUZZLE_HEIGHT_VH = (heightPercent: number) =>
  heightPercent === 50 ? 30 : 18;
const LAST_PIECE_HEIGHT_VH = (heightPercent: number, isUnlockedTask: boolean) =>
  heightPercent === 50 && isUnlockedTask
    ? PUZZLE_HEIGHT_VH(heightPercent)
    : PUZZLE_HEIGHT_VH(heightPercent) / 1.277;

const puzzleData = (
  heightPercent: number,
  unlockedIndex: number
): PuzzlePieceData[] => [
  {
    type: "task-start",
    color: "#FF6B6B",
    height: `${PUZZLE_HEIGHT_VH(heightPercent)}vh`,
  },
  {
    type: "task-middle",
    color: "#4ECDC4",
    height: `${PUZZLE_HEIGHT_VH(heightPercent)}vh`,
  },
  {
    type: "task-middle",
    color: "#FFD166",
    height: `${PUZZLE_HEIGHT_VH(heightPercent)}vh`,
  },
  {
    type: "task-middle",
    color: "#6A4C93",
    height: `${PUZZLE_HEIGHT_VH(heightPercent)}vh`,
  },
  {
    type: "task-end",
    color: "#FF9F1C",
    height: `${LAST_PIECE_HEIGHT_VH(heightPercent, unlockedIndex === 4)}vh`,
  },
];

const ProgressSection: React.FC<ProgressSectionProps> = ({
  heightPercent,
  children,
  onPuzzleClick,
  selectedTaskIndex,
  unlockedIndex,
  completedSubtasks,
}) => {
  const [showSplittedTask, setShowSplittedTask] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (heightPercent === 50) {
      const timer = setTimeout(() => setShowSplittedTask(true), 250);
      return () => clearTimeout(timer);
    } else {
      setShowSplittedTask(false);
    }
  }, [heightPercent]);

  const isTask2Completed = completedSubtasks[1]?.every(
    (subtask) => subtask === true
  );
  const isTask3Completed = completedSubtasks[2]?.every(
    (subtask) => subtask === true
  );
  const isTask4Completed = completedSubtasks[3]?.every(
    (subtask) => subtask === true
  );
  const isTask5Completed = completedSubtasks[4]?.every(
    (subtask) => subtask === true
  );

  const getTaskStyle = (idx: number): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      position: "relative",
      flex: 1,
      transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
    };

    // Calculate movement based on both window dimensions
    const puzzleHeightPx =
      (PUZZLE_HEIGHT_VH(heightPercent) * windowSize.height) / 100;
    const containerWidthPx = windowSize.width * 0.7;
    const movementRatio = containerWidthPx / puzzleHeightPx;

    // Use different multipliers based on task and section state
    const getMovementMultiplier = (isLastTask: boolean) => {
      if (heightPercent === 50) {
        return isLastTask ? 0.725 : 0.685;
      }
      return 0.445;
    };

    const movementVw = movementRatio * getMovementMultiplier(idx === 4);

    // Handle task 5 completion first
    if (isTask5Completed) {
      if (idx === 0) {
        // Task 1 moves furthest right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 4}vw)`,
        };
      } else if (idx === 1) {
        // Task 2 moves further right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 2}vw)`,
        };
      } else if (idx === 2) {
        // Task 3 moves right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 0}vw)`,
        };
      } else if (idx === 3) {
        // Task 4 moves left
        return {
          ...baseStyle,
          transform: `translateX(-${movementVw * 2}vw)`,
        };
      }
      if (idx === 4) {
        // Only task 5 moves left
        return {
          ...baseStyle,
          transform: `translateX(-${movementVw * 4.25}vw)`,
        };
      }
    }
    // Handle task 4 completion
    else if (isTask4Completed) {
      if (idx === 0) {
        // Task 1 moves furthest right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 5}vw)`,
        };
      } else if (idx === 1) {
        // Task 2 moves further right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 3}vw)`,
        };
      } else if (idx === 2) {
        // Task 3 moves right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 1}vw)`,
        };
      } else if (idx === 3) {
        // Task 4 moves left
        return {
          ...baseStyle,
          transform: `translateX(-${movementVw}vw)`,
        };
      }
    }
    // Handle task 3 completion
    else if (isTask3Completed) {
      if (idx === 0) {
        // Task 1 moves further right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw * 3}vw)`,
        };
      } else if (idx === 1) {
        // Task 2 moves right
        return {
          ...baseStyle,
          transform: `translateX(${movementVw}vw)`,
        };
      } else if (idx === 2) {
        // Task 3 moves left
        return {
          ...baseStyle,
          transform: `translateX(-${movementVw}vw)`,
        };
      }
    }
    // Handle task 2 completion
    else if (isTask2Completed) {
      if (idx === 0) {
        return {
          ...baseStyle,
          transform: `translateX(${movementVw}vw)`,
        };
      } else if (idx === 1) {
        return {
          ...baseStyle,
          transform: `translateX(-${movementVw}vw)`,
        };
      }
    }

    return baseStyle;
  };

  const isTaskClickable = (index: number) => {
    if (heightPercent === 50) return false;
    if (selectedTaskIndex !== null) return false;
    return index === unlockedIndex;
  };

  const isTaskLocked = (index: number) => {
    if (index < unlockedIndex) return true;
    if (index === selectedTaskIndex) return false;
    return index > unlockedIndex;
  };

  const renderPuzzlePiece = (piece: PuzzlePieceData, idx: number) => {
    if (heightPercent === 50 && idx === unlockedIndex && showSplittedTask) {
      return (
        <div
          style={{
            opacity: 0,
            animation: "fadeIn 0.3s ease-in forwards",
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            top: 0,
            left: 0,
          }}
        >
          <PuzzleSplittedTask
            color={piece.color}
            height={piece.height}
            className=""
          />
        </div>
      );
    }

    return (
      <div
        style={{
          opacity:
            showSplittedTask && heightPercent === 50 && idx === unlockedIndex
              ? 0
              : 1,
          transition: "opacity 0.3s ease-out",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PuzzlePiece
          type={piece.type as any}
          color={piece.color}
          height={piece.height}
          className={isTaskClickable(idx) ? "puzzle-piece-hoverable" : ""}
        />
      </div>
    );
  };

  return (
    <div className="progress-section" style={{ height: `${heightPercent}vh` }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <div style={{ width: heightPercent === 50 ? "5%" : "15%" }} />
        <div
          style={{
            width: heightPercent === 50 ? "90%" : "70%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Left separator for unlocked piece (if not first) */}
          {unlockedIndex > 0 &&
            unlockedIndex < puzzleData(heightPercent, unlockedIndex).length && (
              <div
                className="vertical-dashed-separator"
                style={{
                  position: "absolute",
                  left: `calc(${
                    (100 / puzzleData(heightPercent, unlockedIndex).length) *
                    unlockedIndex
                  }% - 1px)`,
                  top: 0,
                  height: "100%",
                }}
              />
            )}
          {puzzleData(heightPercent, unlockedIndex).map((piece, idx) => (
            <div key={idx} style={getTaskStyle(idx)}>
              <div
                style={{
                  marginBottom: 8,
                  position: "absolute",
                  top: "1.5vh",
                  left: idx < 4 ? "calc(50% - 1vw)" : "50%",
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }}
                className={
                  isTaskClickable(idx) ? "puzzle-lock-hover" : undefined
                }
              >
                <LockIcon
                  locked={isTaskLocked(idx)}
                  color={piece.color}
                  size="3vh"
                />
              </div>
              <div
                onClick={() => {
                  if (isTaskClickable(idx)) {
                    if (typeof onPuzzleClick === "function") {
                      onPuzzleClick(idx);
                    }
                  }
                }}
                style={{
                  cursor: isTaskClickable(idx) ? "pointer" : "default",
                }}
              >
                {renderPuzzlePiece(piece, idx)}
              </div>
            </div>
          ))}
          {/* Right separator for unlocked piece (if not last) */}
          {unlockedIndex <
            puzzleData(heightPercent, unlockedIndex).length - 1 && (
            <div
              className="vertical-dashed-separator"
              style={{
                position: "absolute",
                left: `calc(${
                  (100 / puzzleData(heightPercent, unlockedIndex).length) *
                  (unlockedIndex + 1)
                }% - 1px)`,
                top: 0,
                height: "100%",
              }}
            />
          )}
        </div>
        <div style={{ width: heightPercent === 50 ? "5%" : "15%" }} />
      </div>
      {children}
    </div>
  );
};

export default ProgressSection;
