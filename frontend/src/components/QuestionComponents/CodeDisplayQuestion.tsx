import React, { useEffect, useState } from "react";
import "./QuestionComponents.css";

interface CodeDisplayQuestionProps {
  questionText: string;
  generatedCode: string;
  onValidityChange: (isValid: boolean) => void;
  onAnswerChange?: (answer: any) => void;
}

const CodeDisplayQuestion: React.FC<CodeDisplayQuestionProps> = ({
  questionText,
  generatedCode,
  onValidityChange,
  onAnswerChange,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Code display questions are always valid
    onValidityChange(true);

    // Set readonly answer
    if (onAnswerChange) {
      onAnswerChange("readonly");
    }
  }, [onValidityChange, onAnswerChange]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: "text/python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ml_model.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="question-container">
      <div className="question-text">{questionText}</div>

      <div className="answer-container">
        <div className="code-display-container">
          <div className="code-header">
            <h4>Generated Python Code</h4>
            <div className="code-actions">
              <button
                type="button"
                onClick={handleCopyCode}
                className="code-action-btn copy-btn"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                type="button"
                onClick={handleDownloadCode}
                className="code-action-btn download-btn"
              >
                ⬇️ Download
              </button>
            </div>
          </div>

          <div className="code-content">
            <pre className="code-block">
              <code className="python-code">{generatedCode}</code>
            </pre>
          </div>

          <div className="code-info">
            <div className="info-section">
              <h5>📄 About This Code</h5>
              <p>
                This code includes all the preprocessing steps and model
                training based on your selections:
              </p>
              <ul>
                <li>Data loading and cleaning</li>
                <li>Feature selection and preprocessing</li>
                <li>Train-test split</li>
                <li>Model training with your chosen hyperparameters</li>
                <li>Basic model evaluation</li>
                <li>Model saving for future use</li>
              </ul>
            </div>

            <div className="info-section">
              <h5>🚀 Next Steps</h5>
              <p>
                You can copy or download this code to run in your Python
                environment. Make sure you have the required libraries
                installed:
              </p>
              <div className="install-command">
                <code>pip install pandas numpy scikit-learn joblib</code>
              </div>
            </div>
          </div>

          <div className="readonly-instruction">
            Review the generated code above and click submit when you're ready
            to proceed.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeDisplayQuestion;
