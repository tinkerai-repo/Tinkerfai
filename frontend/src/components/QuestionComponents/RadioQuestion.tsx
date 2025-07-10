import React, { useState, useEffect } from "react";
import "./QuestionComponents.css";

interface RadioQuestionProps {
  questionText: string;
  options: string[];
  initialValue?: string;
  isRequired: boolean;
  onAnswerChange: (answer: string) => void;
  onValidityChange: (isValid: boolean) => void;
}

const RadioQuestion: React.FC<RadioQuestionProps> = ({
  questionText,
  options,
  initialValue = "",
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialValue);

  useEffect(() => {
    // Check validity whenever selection changes
    const isValid = !isRequired || selectedOption !== "";
    onValidityChange(isValid);
  }, [selectedOption, isRequired, onValidityChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedOption(value);
    onAnswerChange(value);
  };

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        <div
          className={`radio-options ${
            !selectedOption && isRequired ? "invalid" : ""
          }`}
        >
          {options.map((option, index) => (
            <label key={index} className="radio-option">
              <input
                type="radio"
                name="radio-question"
                value={option}
                checked={selectedOption === option}
                onChange={handleChange}
                className="radio-input"
              />
              <span className="radio-custom"></span>
              <span className="radio-label">{option}</span>
            </label>
          ))}
        </div>

        {isRequired && !selectedOption && (
          <div className="validation-message">Please select an option</div>
        )}
      </div>
    </div>
  );
};

export default RadioQuestion;
