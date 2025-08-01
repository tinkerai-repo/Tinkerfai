import React, { useState, useEffect } from "react";
import "./QuestionComponents.css";

interface MultiSelectQuestionProps {
  questionText: string;
  options: string[];
  initialValue?: string[];
  isRequired: boolean;
  onAnswerChange: (answer: string[]) => void;
  onValidityChange: (isValid: boolean) => void;
}

const MultiSelectQuestion: React.FC<MultiSelectQuestionProps> = ({
  questionText,
  options,
  initialValue = [],
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(initialValue);

  useEffect(() => {
    // Check validity whenever selection changes
    const isValid = !isRequired || selectedOptions.length > 0;
    onValidityChange(isValid);
  }, [selectedOptions, isRequired, onValidityChange]);

  const handleChange = (option: string, checked: boolean) => {
    let newSelection: string[];

    if (checked) {
      // Add option to selection
      newSelection = [...selectedOptions, option];
    } else {
      // Remove option from selection
      newSelection = selectedOptions.filter((item) => item !== option);
    }

    setSelectedOptions(newSelection);
    onAnswerChange(newSelection);
  };

  const handleSelectAll = () => {
    const newSelection =
      selectedOptions.length === options.length ? [] : [...options];
    setSelectedOptions(newSelection);
    onAnswerChange(newSelection);
  };

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        <div className="multiselect-header">
          <button
            type="button"
            className="select-all-btn"
            onClick={handleSelectAll}
          >
            {selectedOptions.length === options.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <span className="selection-count">
            {selectedOptions.length} of {options.length} selected
          </span>
        </div>

        <div
          className={`multiselect-options ${
            !selectedOptions.length && isRequired ? "invalid" : ""
          }`}
        >
          {options.map((option, index) => (
            <label key={index} className="multiselect-option">
              <input
                type="checkbox"
                value={option}
                checked={selectedOptions.includes(option)}
                onChange={(e) => handleChange(option, e.target.checked)}
                className="multiselect-input"
              />
              <span className="multiselect-custom"></span>
              <span className="multiselect-label">{option}</span>
            </label>
          ))}
        </div>

        {isRequired && !selectedOptions.length && (
          <div className="validation-message">
            Please select at least one option
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectQuestion;
