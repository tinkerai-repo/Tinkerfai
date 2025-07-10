import React, { useState, useEffect } from "react";
import "./QuestionComponents.css";

interface TextQuestionProps {
  questionText: string;
  initialValue?: string;
  isRequired: boolean;
  onAnswerChange: (answer: string) => void;
  onValidityChange: (isValid: boolean) => void;
}

const TextQuestion: React.FC<TextQuestionProps> = ({
  questionText,
  initialValue = "",
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [answer, setAnswer] = useState(initialValue);

  useEffect(() => {
    // Check validity whenever answer changes
    const isValid = !isRequired || answer.trim().length > 0;
    onValidityChange(isValid);
  }, [answer, isRequired]); // Removed onValidityChange from dependencies

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        <textarea
          value={answer}
          onChange={handleChange}
          placeholder="Enter your answer here..."
          className={`text-answer-input ${
            !answer.trim() && isRequired ? "invalid" : ""
          }`}
          rows={4}
        />

        {isRequired && !answer.trim() && (
          <div className="validation-message">This field is required</div>
        )}

        <div className="character-count">{answer.length} characters</div>
      </div>
    </div>
  );
};

export default TextQuestion;
