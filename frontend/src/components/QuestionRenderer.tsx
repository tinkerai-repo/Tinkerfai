import React, { useState, useEffect } from "react";
import TextQuestion from "./QuestionComponents/TextQuestion";
import RadioQuestion from "./QuestionComponents/RadioQuestion";
import FileQuestion from "./QuestionComponents/FileQuestion";
import ReadOnlyQuestion from "./QuestionComponents/ReadOnlyQuestion";
import MultiSelectQuestion from "./QuestionComponents/MultiSelectQuestion"; // NEW
import { Question, Answer, QuestionType } from "../services/projectApi";

interface QuestionRendererProps {
  question: Question;
  existingAnswer?: Answer;
  datasetSummary?: any;
  projectId: string;
  onAnswerChange: (answer: any) => void;
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
      let initialAnswer: any = {};

      switch (question.questionType) {
        case "text":
          initialAnswer = {
            answerType: "text",
            textAnswer: existingAnswer.textAnswer || "",
          };
          break;
        case "radio":
          initialAnswer = {
            answerType: "radio",
            selectedOption: existingAnswer.selectedOption || "",
          };
          break;
        case "multiselect": // NEW: Handle multiselect
          initialAnswer = {
            answerType: "multiselect",
            selectedOptions: existingAnswer.selectedOptions || [],
          };
          break;
        case "file":
          initialAnswer = {
            answerType: "file",
            fileName: existingAnswer.fileName || "",
            fileUrl: existingAnswer.fileUrl || "",
          };
          break;
        case "readonly":
          initialAnswer = {
            answerType: "readonly",
          };
          break;
      }

      setCurrentAnswer(initialAnswer);
      onAnswerChange(initialAnswer);
    }
  }, [existingAnswer, question.questionType, onAnswerChange]);

  const handleAnswerChange = (answer: any) => {
    let formattedAnswer: any = {};

    switch (question.questionType) {
      case "text":
        formattedAnswer = {
          answerType: "text",
          textAnswer: answer,
        };
        break;
      case "radio":
        formattedAnswer = {
          answerType: "radio",
          selectedOption: answer,
        };
        break;
      case "multiselect": // NEW: Handle multiselect
        formattedAnswer = {
          answerType: "multiselect",
          selectedOptions: answer,
        };
        break;
      case "file":
        formattedAnswer = {
          answerType: "file",
          fileName: answer.fileName,
          fileUrl: answer.fileUrl,
        };
        break;
      case "readonly":
        formattedAnswer = {
          answerType: "readonly",
        };
        break;
    }

    setCurrentAnswer(formattedAnswer);
    onAnswerChange(formattedAnswer);
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

      case "multiselect": // NEW: Handle multiselect
        return (
          <MultiSelectQuestion
            questionText={question.questionText}
            options={question.options || []}
            initialValue={existingAnswer?.selectedOptions || []}
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
              existingAnswer?.fileName && existingAnswer?.fileUrl
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
            onAnswerChange={handleAnswerChange}
          />
        );

      default:
        return (
          <div className="error-state">
            <p>Unknown question type: {question.questionType}</p>
          </div>
        );
    }
  };

  return <div className="question-renderer">{renderQuestion()}</div>;
};

export default QuestionRenderer;
