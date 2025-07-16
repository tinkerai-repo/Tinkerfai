import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./PlaygroundSection.css";
import PuzzlePiece from "./PuzzlePiece";
import SubmitButton from "./SubmitButton";
import QuestionRenderer from "./QuestionRenderer";
import {
  projectApi,
  Question,
  Answer,
  getCurrentUser,
} from "../services/projectApi";

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
  unlockedIndex?: number;
}

const PlaygroundSection: React.FC<PlaygroundSectionProps> = ({
  selectedTaskIndex,
  currentSubtaskIndex,
  onSubtaskClick,
  completedSubtasks,
  children,
  unlockedIndex = 0,
}) => {
  const { projectId } = useParams<{ projectId: string }>();

  // Question system state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [existingAnswer, setExistingAnswer] = useState<Answer | undefined>();
  const [datasetSummary, setDatasetSummary] = useState<any>(null);
  const [currentAnswerData, setCurrentAnswerData] = useState<any>(null);
  const [isAnswerValid, setIsAnswerValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Original puzzle animation state
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [isSubtaskSelected, setIsSubtaskSelected] = useState(false);
  const [isOffsetApplied, setIsOffsetApplied] = useState(false);

  // Load question when task/subtask changes
  useEffect(() => {
    if (selectedTaskIndex !== null && projectId) {
      loadQuestion();
    } else {
      // Reset question state when no task is selected
      setCurrentQuestion(null);
      setExistingAnswer(undefined);
      setDatasetSummary(null);
      setCurrentAnswerData(null);
      setIsAnswerValid(false);
      setErrorMessage("");
    }
  }, [selectedTaskIndex, currentSubtaskIndex, projectId]);

  const loadQuestion = async () => {
    if (!projectId || selectedTaskIndex === null) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await projectApi.getQuestion(
        projectId,
        selectedTaskIndex + 1, // Convert to 1-based indexing
        currentSubtaskIndex
      );

      if (response.success) {
        setCurrentQuestion(response.data.question);
        setExistingAnswer(response.data.existingAnswer);
        setDatasetSummary(response.data.datasetSummary);

        // If there's an existing answer, the form should be valid
        if (response.data.existingAnswer) {
          setIsAnswerValid(true);
        }
      } else {
        setErrorMessage(response.message);
      }
    } catch (error: any) {
      console.error("Error loading question:", error);
      setErrorMessage(error.message || "Failed to load question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (answerData: any) => {
    setCurrentAnswerData(answerData);
  };

  const handleValidityChange = (isValid: boolean) => {
    setIsAnswerValid(isValid);
  };

  const handleSubmitAnswer = async () => {
    if (
      !projectId ||
      !currentQuestion ||
      !currentAnswerData ||
      !isAnswerValid
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const user = getCurrentUser();
      if (!user?.email) {
        throw new Error("User not authenticated");
      }

      const submissionData = {
        userEmail: user.email,
        projectId: projectId,
        taskIndex: currentQuestion.taskIndex,
        subtaskIndex: currentQuestion.subtaskIndex,
        questionId: currentQuestion.questionId,
        answerType: currentAnswerData.answerType,
        textAnswer: currentAnswerData.textAnswer,
        selectedOption: currentAnswerData.selectedOption,
        fileName: currentAnswerData.fileName,
        fileUrl: currentAnswerData.fileUrl,
      };

      const response = await projectApi.submitAnswer(projectId, submissionData);

      if (response.success) {
        // Reset animation states
        setShowSubmitButton(false);
        setIsSubtaskSelected(false);
        setIsOffsetApplied(false);

        // Move to next subtask
        onSubtaskClick(currentSubtaskIndex);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      setErrorMessage(error.message || "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Original puzzle logic for when no task is selected
  if (selectedTaskIndex === null) {
    let title = "Select a task to get started";
    let desc =
      "Choose a puzzle piece from the progress section above to begin your\nlearning journey!";
    if (unlockedIndex === 0) {
      title = "Select first task to get started";
      desc =
        "Choose a puzzle piece from the progress section above to begin your\nlearning journey!";
    } else {
      title = "Select next task to get started";
      desc =
        "Choose the next puzzle piece from the progress section above to continue your\nlearning journey!";
    }
    return (
      <div
        className="playground-section"
        style={{ paddingTop: `33vh`, height: "100%" }}
      >
        <div className="no-task-selected">
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
        {children}
      </div>
    );
  }

  // Special handling for first task (no subtasks) - show question instead of submit button
  if (selectedTaskIndex === 0) {
    return (
      <div
        className="playground-section question-mode"
        style={{ paddingTop: `5vh`, height: "100%" }}
      >
        <div className="question-container-wrapper">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading question...</p>
            </div>
          ) : errorMessage ? (
            <div className="error-state">
              <p className="error-message">{errorMessage}</p>
              <button onClick={loadQuestion} className="retry-button">
                Try Again
              </button>
            </div>
          ) : currentQuestion ? (
            <>
              <QuestionRenderer
                question={currentQuestion}
                existingAnswer={existingAnswer}
                datasetSummary={datasetSummary}
                projectId={projectId!}
                onAnswerChange={handleAnswerChange}
                onValidityChange={handleValidityChange}
              />

              <div className="submit-section">
                <SubmitButton
                  onClick={handleSubmitAnswer}
                  position="center"
                  taskIndex={selectedTaskIndex}
                  subtaskIndex={currentSubtaskIndex}
                  disabled={!isAnswerValid || isSubmitting}
                  loading={isSubmitting}
                />

                {errorMessage && (
                  <div className="submit-error">{errorMessage}</div>
                )}
              </div>
            </>
          ) : null}
        </div>
        {children}
      </div>
    );
  }

  // For other tasks (2-5), restore original animation logic with question integration
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

  const shiftDirection = getShiftDirection();
  const shouldShowSeparator = selectedTaskIndex !== null && isSubtaskSelected;

  // Determine question position: left for odd subtasks (1,3), right for even subtasks (2,4)
  const isQuestionOnLeft =
    currentSubtaskIndex === 0 || currentSubtaskIndex === 2;

  return (
    <div
      className="playground-section"
      style={{ height: "100%", position: "relative" }}
    >
      {/* Question Section - positioned based on subtask */}
      {isSubtaskSelected && (
        <div
          className={`question-section ${
            isQuestionOnLeft ? "question-left" : "question-right"
          }`}
        >
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading question...</p>
            </div>
          ) : errorMessage ? (
            <div className="error-state">
              <p className="error-message">{errorMessage}</p>
              <button onClick={loadQuestion} className="retry-button">
                Try Again
              </button>
            </div>
          ) : currentQuestion ? (
            <>
              <QuestionRenderer
                question={currentQuestion}
                existingAnswer={existingAnswer}
                datasetSummary={datasetSummary}
                projectId={projectId!}
                onAnswerChange={handleAnswerChange}
                onValidityChange={handleValidityChange}
              />

              {/* Submit button inside question section */}
              <div className="question-submit-section">
                <SubmitButton
                  onClick={handleSubmitAnswer}
                  position="center"
                  taskIndex={selectedTaskIndex}
                  subtaskIndex={currentSubtaskIndex}
                  disabled={!isAnswerValid || isSubmitting}
                  loading={isSubmitting}
                />

                {errorMessage && (
                  <div className="submit-error">{errorMessage}</div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

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
                {/* Centered Subtask label with line break */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 400,
                    fontSize: "1.8vh",
                    color: "#222",
                    zIndex: 3,
                    pointerEvents: "none",
                    whiteSpace: "pre-line",
                    transform:
                      i === 0
                        ? "translate(-9%, -9%)"
                        : i === 3
                        ? "translate(9%, 9%)"
                        : undefined,
                  }}
                >
                  <span style={{ width: "100%", textAlign: "center" }}>
                    {`Sub\ntask ${i + 1}`.replace("\\n", "\n")}
                  </span>
                </div>
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

        {/* Original submit button removed from here since it's now inside question section */}

        {errorMessage && showSubmitButton && !currentQuestion && (
          <div className="submit-error-overlay">{errorMessage}</div>
        )}
      </div>
      {children}
    </div>
  );
};

export default PlaygroundSection;
