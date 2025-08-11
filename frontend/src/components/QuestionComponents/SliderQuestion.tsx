import React, { useState, useEffect } from "react";
import "./QuestionComponents.css";

interface SliderQuestionProps {
  questionText: string;
  sliderConfig: {
    min: number;
    max: number;
    default: number;
    step: number;
    leftLabel: string;
    rightLabel: string;
  };
  initialValue?: number;
  isRequired: boolean;
  onAnswerChange: (answer: number) => void;
  onValidityChange: (isValid: boolean) => void;
}

const SliderQuestion: React.FC<SliderQuestionProps> = ({
  questionText,
  sliderConfig,
  initialValue,
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [sliderValue, setSliderValue] = useState(
    initialValue || sliderConfig.default
  );

  // Initialize validity and answer on mount
  useEffect(() => {
    onValidityChange(true);
    console.log("SliderQuestion: Initializing with value:", sliderValue); // Debug log
    onAnswerChange(sliderValue);
  }, []); // Run only once on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    console.log("SliderQuestion: Slider changed to:", value); // Debug log
    setSliderValue(value);
    onAnswerChange(value);
  };

  const testPercentage = 100 - sliderValue;

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        <div className="slider-container">
          {/* Labels */}
          <div className="slider-labels">
            <span className="slider-label-left">
              {sliderConfig.leftLabel}: {sliderValue}%
            </span>
            <span className="slider-label-right">
              {sliderConfig.rightLabel}: {testPercentage}%
            </span>
          </div>

          {/* Slider */}
          <div className="slider-wrapper">
            <input
              type="range"
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={sliderConfig.step}
              value={sliderValue}
              onChange={handleChange}
              className="slider-input"
            />
            <div className="slider-track">
              <div
                className="slider-fill-train"
                style={{
                  width: `${
                    ((sliderValue - sliderConfig.min) /
                      (sliderConfig.max - sliderConfig.min)) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Visual representation */}
          <div className="train-test-visual">
            <div className="visual-container">
              <div
                className="train-section"
                style={{ width: `${sliderValue}%` }}
              >
                <span className="section-label">Training Data</span>
              </div>
              <div
                className="test-section"
                style={{ width: `${testPercentage}%` }}
              >
                <span className="section-label">Testing Data</span>
              </div>
            </div>
            <div className="visual-percentages">
              <span style={{ width: `${sliderValue}%`, textAlign: "center" }}>
                {sliderValue}%
              </span>
              <span
                style={{ width: `${testPercentage}%`, textAlign: "center" }}
              >
                {testPercentage}%
              </span>
            </div>
          </div>

          {/* Info text */}
          <div className="slider-info">
            <p>
              Your model will be trained on <strong>{sliderValue}%</strong> of
              the data and tested on the remaining{" "}
              <strong>{testPercentage}%</strong> to evaluate its performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SliderQuestion;
