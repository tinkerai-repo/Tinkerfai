import React, { useEffect } from "react";
import "./QuestionComponents.css";

interface ReadOnlyQuestionProps {
  questionText: string;
  datasetSummary?: any; // For dataset summary display
  onValidityChange: (isValid: boolean) => void;
  onAnswerChange?: (answer: any) => void; // 🎯 ADD THIS LINE
}

const ReadOnlyQuestion: React.FC<ReadOnlyQuestionProps> = ({
  questionText,
  datasetSummary,
  onValidityChange,
  onAnswerChange, // 🎯 ADD THIS LINE
}) => {
  useEffect(() => {
    // Read-only questions are always valid
    onValidityChange(true);

    // 🎯 ADD THESE LINES: Immediately set readonly answer
    if (onAnswerChange) {
      onAnswerChange("readonly");
    }
  }, []); // 🎯 ADD onAnswerChange to dependency array

  const renderDatasetSummary = () => {
    if (!datasetSummary) return null;

    return (
      <div className="dataset-summary">
        <div className="summary-header">
          <h4>Dataset Overview</h4>
        </div>

        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Rows:</span>
            <span className="stat-value">
              {datasetSummary.rowCount.toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Columns:</span>
            <span className="stat-value">{datasetSummary.columnCount}</span>
          </div>
        </div>

        <div className="columns-info">
          <h5>Column Information</h5>
          <div className="columns-grid">
            {datasetSummary.columns.map((col: any, index: number) => (
              <div key={index} className="column-item">
                <div className="column-name">{col.name}</div>
                <div className="column-details">
                  <span className="column-type">{col.type}</span>
                  <span className="column-unique">
                    {col.unique_values} unique
                  </span>
                  <span className="column-unique-tag">Unique</span>
                  <span className="column-semantic">{col.semantic_type}</span>
                  {col.semantic_type === "numeric" &&
                    col.mean !== undefined &&
                    col.mean !== null && (
                      <span className="column-mean">
                        Mean: {col.mean.toFixed(2)}
                      </span>
                    )}
                  {col.semantic_type !== "numeric" &&
                    col.mode !== undefined &&
                    col.mode !== null && (
                      <span className="column-mode">Mode: {col.mode}</span>
                    )}
                  {col.missing_count > 0 && (
                    <span className="column-missing">
                      {col.missing_count} missing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {Object.values(datasetSummary.missingValues).some(
          (count: any) => count > 0
        ) && (
          <div className="missing-values">
            <h5>Missing Values</h5>
            <div className="missing-grid">
              {Object.entries(datasetSummary.missingValues).map(
                ([column, count]: [string, any]) =>
                  count > 0 && (
                    <div key={column} className="missing-item">
                      <span className="missing-column">{column}:</span>
                      <span className="missing-count">
                        {count} (
                        {((count / datasetSummary.rowCount) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {datasetSummary.dataPreview &&
          datasetSummary.dataPreview.length > 0 && (
            <div className="data-preview">
              <h5>Sample Data</h5>
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {Object.keys(datasetSummary.dataPreview[0]).map(
                        (column) => (
                          <th key={column}>{column}</th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetSummary.dataPreview
                      .slice(0, 3)
                      .map((row: any, index: number) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex}>
                              {value !== null && value !== undefined
                                ? String(value)
                                : "N/A"}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="question-container readonly">
      <div className="question-text">{questionText}</div>
      <div className="answer-container">
        <div className="readonly-content">
          {datasetSummary && renderDatasetSummary()}
          <div className="readonly-instruction">
            Review the information above and click submit when you're ready to
            continue.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyQuestion;
