import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import "./Project.css";
import Header from "./components/Header";
import ProgressSection from "./components/ProgressSection";
import PlaygroundSection from "./components/PlaygroundSection";
import DragHandleOverlay from "./components/DragHandleOverlay";
import ChatBotSection from "./components/ChatBotSection";
import ChatBotHandleOverlay from "./components/ChatBotHandleOverlay";
import { projectApi } from "./services/projectApi";

function Project() {
  // Get the projectId from the URL parameters
  const { projectId } = useParams<{ projectId: string }>();

  // State for project validation
  const [isValidProject, setIsValidProject] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Your existing state
  const [progressSectionHeight, setProgressSectionHeight] = useState(25);
  const [chatbotSectionHeight, setChatbotSectionHeight] = useState(5);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(
    null
  );
  const [completedSubtasks, setCompletedSubtasks] = useState<boolean[][]>([
    [], // First task has no subtasks
    [false, false, false, false],
    [false, false, false, false],
    [false, false, false, false],
    [false, false, false, false],
  ]);
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState<number>(0);
  const [unlockedIndex, setUnlockedIndex] = useState(0);

  // Validate project ID on component mount
  useEffect(() => {
    const validateProject = async () => {
      // If no projectId, mark as invalid
      if (!projectId) {
        setIsValidProject(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if this project belongs to the current user
        const response = await projectApi.getProject(projectId);

        if (response.success) {
          setIsValidProject(true);
        } else {
          setIsValidProject(false);
        }
      } catch (error) {
        console.error("Error validating project:", error);
        setIsValidProject(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateProject();
  }, [projectId]);

  // Redirect to profile if project is invalid or doesn't belong to user
  if (!isLoading && !isValidProject) {
    return <Navigate to="/profile" replace />;
  }

  // Show loading while validating
  if (isLoading) {
    return (
      <>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
            fontSize: "1.2rem",
            color: "#666",
          }}
        >
          Loading...
        </div>
      </>
    );
  }

  // Your existing handlers (unchanged)
  const handleProgressSectionHeight = (percent: number) => {
    if (percent === 50 && chatbotSectionHeight === 50) {
      setChatbotSectionHeight(5);
    }
    setProgressSectionHeight(percent);
  };

  const handleChatbotSectionHeight = (percent: number) => {
    if (percent === 50 && progressSectionHeight === 50) {
      setProgressSectionHeight(25);
    }
    setChatbotSectionHeight(percent);
  };

  const handleTaskClick = (taskIndex: number) => {
    if (selectedTaskIndex === null) {
      setSelectedTaskIndex(taskIndex);
      setCurrentSubtaskIndex(0);
    }
  };

  const handleSubtaskClick = (subtaskIndex: number) => {
    if (selectedTaskIndex === null) return;

    // Special handling for first task (no subtasks)
    if (selectedTaskIndex === 0) {
      setSelectedTaskIndex(null);
      setCurrentSubtaskIndex(0);
      setUnlockedIndex(1); // Unlock the next task
      return;
    }

    // Only allow clicking the current subtask
    if (subtaskIndex !== currentSubtaskIndex) return;

    // Mark the current subtask as completed
    const newCompletedSubtasks = [...completedSubtasks];
    newCompletedSubtasks[selectedTaskIndex][subtaskIndex] = true;
    setCompletedSubtasks(newCompletedSubtasks);

    // If this was the last subtask, lock the current task and unlock the next
    if (subtaskIndex === 3) {
      setSelectedTaskIndex(null);
      setCurrentSubtaskIndex(0);
      setUnlockedIndex(selectedTaskIndex + 1); // Increment unlockedIndex to unlock next task
    } else {
      // Otherwise, unlock the next subtask
      setCurrentSubtaskIndex(subtaskIndex + 1);
    }
  };

  return (
    <>
      <Header />
      <div className="main-sections">
        <ProgressSection
          heightPercent={progressSectionHeight}
          onHeightChange={handleProgressSectionHeight}
          onPuzzleClick={handleTaskClick}
          selectedTaskIndex={selectedTaskIndex}
          completedSubtasks={completedSubtasks}
          unlockedIndex={unlockedIndex}
        />
        <PlaygroundSection
          selectedTaskIndex={selectedTaskIndex}
          currentSubtaskIndex={currentSubtaskIndex}
          onSubtaskClick={handleSubtaskClick}
          completedSubtasks={completedSubtasks}
          unlockedIndex={unlockedIndex}
        />
        <DragHandleOverlay
          top={`calc(8vh + ${progressSectionHeight}vh)`}
          onDrag={handleProgressSectionHeight}
          isMax={progressSectionHeight === 50}
          onCollapse={() => handleProgressSectionHeight(25)}
        />
        <ChatBotSection
          heightPercent={chatbotSectionHeight}
          onHeightChange={handleChatbotSectionHeight}
        />
        <ChatBotHandleOverlay
          bottom={`calc(${chatbotSectionHeight}vh)`}
          onDrag={handleChatbotSectionHeight}
          isMax={chatbotSectionHeight === 50}
          onCollapse={() => handleChatbotSectionHeight(5)}
        />
      </div>
    </>
  );
}

export default Project;
