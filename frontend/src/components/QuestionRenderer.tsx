import React, { useState, useEffect } from "react";
import {
  Question,
  Answer,
  QuestionType,
  DatasetSummary,
} from "../services/projectApi";
import TextQuestion from "./QuestionComponents/TextQuestion";
import RadioQuestion from "./QuestionComponents/RadioQuestion";
import FileQuestion from "./QuestionComponents/FileQuestion";
import ReadOnlyQuestion from "./QuestionComponents/ReadOnlyQuestion";

interface QuestionRendererProps {
  question: Question;
  existingAnswer?: Answer;
  datasetSummary?: DatasetSummary;
  projectId: string;
  onAnswerChange: (answerData: any) => void;
  onValidityChange: (isValid: boolean) => void;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  existingAnswer,
  datasetSummary,
  projectId,
  onAnswerChange,
  onValidityChange,
}) => {
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);

  useEffect(() => {
    // Initialize with existing answer if available
    if (existingAnswer) {
      switch (question.questionType) {
        case "text":
          setCurrentAnswer(existingAnswer.textAnswer || "");
          onAnswerChange({
            answerType: "text",
            textAnswer: existingAnswer.textAnswer || "",
          });
          break;
        case "radio":
          setCurrentAnswer(existingAnswer.selectedOption || "");
          onAnswerChange({
            answerType: "radio",
            selectedOption: existingAnswer.selectedOption || "",
          });
          break;
        case "file":
          const fileData = {
            fileName: existingAnswer.fileName || "",
            fileUrl: existingAnswer.fileUrl || "",
          };
          setCurrentAnswer(fileData);
          onAnswerChange({
            answerType: "file",
            fileName: existingAnswer.fileName || "",
            fileUrl: existingAnswer.fileUrl || "",
          });
          break;
        case "readonly":
          onAnswerChange({
            answerType: "readonly",
          });
          break;
      }
    }
  }, [existingAnswer, question.questionType, onAnswerChange]);

  const handleAnswerChange = (answer: any) => {
    setCurrentAnswer(answer);

    switch (question.questionType) {
      case "text":
        onAnswerChange({
          answerType: "text",
          textAnswer: answer,
        });
        break;
      case "radio":
        onAnswerChange({
          answerType: "radio",
          selectedOption: answer,
        });
        break;
      case "file":
        onAnswerChange({
          answerType: "file",
          fileName: answer.fileName,
          fileUrl: answer.fileUrl,
        });
        break;
      case "readonly":
        onAnswerChange({
          answerType: "readonly",
        });
        break;
    }
  };

  const renderQuestion = () => {
    switch (question.questionType) {
      case "text":
        return (
          <TextQuestion
            questionText={question.questionText}
            initialValue={existingAnswer?.textAnswer || ""}
            isRequired={question.isRequired}
            onAnswerChange={handleAnswerChange}
            onValidityChange={onValidityChange}
          />
        );

      case "radio":
        return (
          <RadioQuestion
            questionText={question.questionText}
            options={question.options || []}
            initialValue={existingAnswer?.selectedOption || ""}
            isRequired={question.isRequired}
            onAnswerChange={handleAnswerChange}
            onValidityChange={onValidityChange}
          />
        );

      case "file":
        return (
          <FileQuestion
            questionText={question.questionText}
            projectId={projectId}
            taskIndex={question.taskIndex}
            subtaskIndex={question.subtaskIndex}
            fileTypes={question.fileTypes || [".csv"]}
            maxFileSize={question.maxFileSize || 5 * 1024 * 1024}
            initialValue={
              existingAnswer
                ? {
                    fileName: existingAnswer.fileName,
                    fileUrl: existingAnswer.fileUrl,
                  }
                : undefined
            }
            isRequired={question.isRequired}
            onAnswerChange={handleAnswerChange}
            onValidityChange={onValidityChange}
          />
        );

      case "readonly":
        return (
          <ReadOnlyQuestion
            questionText={question.questionText}
            datasetSummary={datasetSummary}
            onValidityChange={onValidityChange}
          />
        );

      default:
        return (
          <div className="question-container">
            <div className="question-text">
              Unsupported question type: {question.questionType}
            </div>
          </div>
        );
    }
  };

  return <div className="question-renderer">{renderQuestion()}</div>;
};

export default QuestionRenderer;
