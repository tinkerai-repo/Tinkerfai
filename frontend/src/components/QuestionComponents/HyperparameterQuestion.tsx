import React, { useState, useEffect } from "react";
import "./QuestionComponents.css";

interface HyperparameterConfig {
  name: string;
  type: "integer" | "float" | "select";
  min?: number;
  max?: number;
  default: number | string;
  options?: string[];
  description: string;
}

interface HyperparameterQuestionProps {
  questionText: string;
  hyperparameters: HyperparameterConfig[];
  initialValue?: Record<string, any>;
  isRequired: boolean;
  onAnswerChange: (answer: Record<string, any>) => void;
  onValidityChange: (isValid: boolean) => void;
}

const HyperparameterQuestion: React.FC<HyperparameterQuestionProps> = ({
  questionText,
  hyperparameters,
  initialValue = {},
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    // Initialize with existing values or defaults
    const defaultValues: Record<string, any> = {};
    hyperparameters.forEach((param) => {
      defaultValues[param.name] =
        initialValue[param.name] !== undefined
          ? initialValue[param.name]
          : param.default;
    });
    return defaultValues;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateAndUpdate();
  }, [values, hyperparameters, isRequired]);

  const validateAndUpdate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    hyperparameters.forEach((param) => {
      const value = values[param.name];

      if (param.type === "integer" || param.type === "float") {
        const numValue = Number(value);

        // Check if it's a valid number
        if (isNaN(numValue)) {
          newErrors[param.name] = "Must be a valid number";
          isValid = false;
          return;
        }

        // Check if integer type is actually an integer
        if (param.type === "integer" && !Number.isInteger(numValue)) {
          newErrors[param.name] = "Must be a whole number";
          isValid = false;
          return;
        }

        // Check range
        if (param.min !== undefined && numValue < param.min) {
          newErrors[param.name] = `Must be at least ${param.min}`;
          isValid = false;
          return;
        }

        if (param.max !== undefined && numValue > param.max) {
          newErrors[param.name] = `Must be at most ${param.max}`;
          isValid = false;
          return;
        }
      }

      // For select type, check if value is in options
      if (param.type === "select" && param.options) {
        if (!param.options.includes(value)) {
          newErrors[param.name] = "Invalid selection";
          isValid = false;
          return;
        }
      }
    });

    setErrors(newErrors);
    onValidityChange(isValid);

    if (isValid) {
      onAnswerChange(values);
    }
  };

  const handleChange = (paramName: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const renderParameter = (param: HyperparameterConfig) => {
    const value = values[param.name];
    const error = errors[param.name];
    const hasError = !!error;

    if (param.type === "select" && param.options) {
      return (
        <div key={param.name} className="hyperparameter-item">
          <label className="hyperparameter-label">
            <span className="param-name">{param.name}</span>
            <span className="param-description">{param.description}</span>
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className={`hyperparameter-select ${hasError ? "error" : ""}`}
          >
            {param.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {hasError && <div className="param-error">{error}</div>}
        </div>
      );
    }

    // Numeric input (integer or float)
    return (
      <div key={param.name} className="hyperparameter-item">
        <label className="hyperparameter-label">
          <span className="param-name">{param.name}</span>
          <span className="param-description">{param.description}</span>
          {(param.min !== undefined || param.max !== undefined) && (
            <span className="param-range">
              Range: {param.min !== undefined ? param.min : "−∞"} to{" "}
              {param.max !== undefined ? param.max : "∞"}
            </span>
          )}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(param.name, e.target.value)}
          step={param.type === "float" ? "any" : "1"}
          min={param.min}
          max={param.max}
          className={`hyperparameter-input ${hasError ? "error" : ""}`}
          placeholder={`Default: ${param.default}`}
        />
        {hasError && <div className="param-error">{error}</div>}
      </div>
    );
  };

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        <div className="hyperparameters-container">
          <div className="hyperparameters-info">
            <p>
              Configure the hyperparameters for your model. These values control
              how the algorithm learns from your data. Default values are
              recommended starting points.
            </p>
          </div>

          <div className="hyperparameters-grid">
            {hyperparameters.map((param) => renderParameter(param))}
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="validation-message error">
              Please fix the errors above before proceeding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HyperparameterQuestion;
