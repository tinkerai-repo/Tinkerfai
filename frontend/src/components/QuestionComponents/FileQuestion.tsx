import React, { useState, useEffect, useRef } from "react";
import { projectApi } from "../../services/projectApi";
import "./QuestionComponents.css";

interface FileQuestionProps {
  questionText: string;
  projectId: string;
  taskIndex: number;
  subtaskIndex: number;
  fileTypes: string[];
  maxFileSize: number;
  initialValue?: { fileName?: string; fileUrl?: string };
  isRequired: boolean;
  onAnswerChange: (answer: { fileName: string; fileUrl: string }) => void;
  onValidityChange: (isValid: boolean) => void;
}

const FileQuestion: React.FC<FileQuestionProps> = ({
  questionText,
  projectId,
  taskIndex,
  subtaskIndex,
  fileTypes,
  maxFileSize,
  initialValue,
  isRequired,
  onAnswerChange,
  onValidityChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "validating" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(initialValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check validity based on upload status and requirements
    const isValid: boolean =
      !isRequired || Boolean(uploadedFile && uploadStatus === "success");
    onValidityChange(isValid);
  }, [uploadedFile, uploadStatus, isRequired, onValidityChange]);

  const validateFile = (selectedFile: File): string | null => {
    // Check file type
    const fileExtension =
      "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!fileTypes.includes(fileExtension)) {
      return `Invalid file type. Allowed types: ${fileTypes.join(", ")}`;
    }

    // Check file size
    if (selectedFile.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus("error");
      return;
    }

    setFile(selectedFile);
    setErrorMessage("");
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Get upload URL
      const uploadResponse = await projectApi.getUploadUrl(
        projectId,
        taskIndex,
        subtaskIndex,
        selectedFile.name
      );

      if (
        !uploadResponse.success ||
        !uploadResponse.uploadUrl ||
        !uploadResponse.fileKey
      ) {
        throw new Error(uploadResponse.message);
      }

      // Upload file
      setUploadProgress(50);
      const uploadSuccess = await projectApi.uploadFile(
        uploadResponse.uploadUrl,
        selectedFile
      );

      if (!uploadSuccess) {
        throw new Error("File upload failed");
      }

      setUploadProgress(75);
      setUploadStatus("validating");

      // Validate uploaded file
      const validationResponse = await projectApi.validateFile(
        projectId,
        uploadResponse.fileKey
      );

      if (!validationResponse.success || !validationResponse.isValid) {
        throw new Error(validationResponse.message);
      }

      setUploadProgress(100);
      setUploadStatus("success");

      const fileData = {
        fileName: selectedFile.name,
        fileUrl: uploadResponse.fileKey,
      };

      setUploadedFile(fileData);
      onAnswerChange(fileData);
    } catch (error: any) {
      console.error("File upload error:", error);
      setErrorMessage(error.message || "Upload failed");
      setUploadStatus("error");
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="question-container">
      <div className="question-text">
        {questionText}
        {isRequired && <span className="required-indicator">*</span>}
      </div>

      <div className="answer-container">
        {!uploadedFile ? (
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept={fileTypes.join(",")}
              onChange={handleFileSelect}
              className="file-input"
              id="file-upload"
              disabled={
                uploadStatus === "uploading" || uploadStatus === "validating"
              }
            />

            <label
              htmlFor="file-upload"
              className={`file-upload-label ${
                uploadStatus === "uploading" || uploadStatus === "validating"
                  ? "disabled"
                  : ""
              }`}
            >
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Choose a file</strong> or drag it here
              </div>
              <div className="upload-hint">
                Supported: {fileTypes.join(", ")} • Max{" "}
                {formatFileSize(maxFileSize)}
              </div>
            </label>

            {(uploadStatus === "uploading" ||
              uploadStatus === "validating") && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {uploadStatus === "uploading"
                    ? "Uploading..."
                    : "Validating file..."}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="uploaded-file">
            <div className="file-info">
              <div className="file-icon">✅</div>
              <div className="file-details">
                <div className="file-name">{uploadedFile.fileName}</div>
                <div className="file-status">Upload successful</div>
              </div>
            </div>
            <button
              type="button"
              className="remove-file-btn"
              onClick={handleRemoveFile}
            >
              Remove
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="validation-message error">{errorMessage}</div>
        )}

        {isRequired &&
          !uploadedFile &&
          uploadStatus !== "uploading" &&
          uploadStatus !== "validating" && (
            <div className="validation-message">
              Please upload a file to continue
            </div>
          )}
      </div>
    </div>
  );
};

export default FileQuestion;
