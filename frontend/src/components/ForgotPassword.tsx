import React, { useState } from "react";
import "./ForgotPassword.css";
import logo from "../assets/tinkerfai-logo.png";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  // Form states
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [currentStep, setCurrentStep] = useState<"email" | "reset" | "success">(
    "email"
  );
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrorMessage("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Move to OTP + password reset step
        setCurrentStep("reset");
      } else {
        setErrorMessage(
          data.detail || data.message || "Failed to send reset instructions"
        );
      }
    } catch (error) {
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend password validation
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setPasswordError("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          confirmationCode: otpCode,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success screen
        setCurrentStep("success");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        setErrorMessage(data.detail || data.message || "Password reset failed");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setErrorMessage(""); // Clear any errors
        // Could show a success message here if needed
      } else {
        setErrorMessage(data.detail || data.message || "Failed to resend code");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (currentStep === "success") {
    return (
      <div className="forgot-password-container success-message">
        <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been updated successfully.</p>
          <p>Redirecting to sign in...</p>
          <div className="spinner" style={{ margin: "1rem auto" }}></div>
        </div>
      </div>
    );
  }

  // OTP + New Password screen
  if (currentStep === "reset") {
    return (
      <div className="forgot-password-container">
        <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
        <h2 className="forgot-password-title">Reset Your Password</h2>
        <p className="forgot-password-text">
          We've sent a verification code to
          <br />
          <strong>{email}</strong>
        </p>

        <form className="forgot-password-form" onSubmit={handlePasswordReset}>
          <input
            type="text"
            placeholder="Enter verification code"
            className="login-input"
            maxLength={6}
            required
            value={otpCode}
            onChange={(e) => {
              setOtpCode(e.target.value);
              setErrorMessage("");
            }}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              letterSpacing: "0.1rem",
            }}
          />

          <div className="password-wrapper">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New password (8+ characters)"
              className="login-input"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
                setErrorMessage("");
              }}
            />
            <span
              className="toggle-password"
              onClick={() => setShowNewPassword((prev) => !prev)}
              style={{ cursor: "pointer" }}
            >
              {showNewPassword ? "👁️" : "🙈"}
            </span>
          </div>

          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="login-input"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError("");
                setErrorMessage("");
              }}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{ cursor: "pointer" }}
            >
              {showConfirmPassword ? "👁️" : "🙈"}
            </span>
          </div>

          {passwordError && <div className="error-msg">{passwordError}</div>}

          {errorMessage && <div className="error-msg">{errorMessage}</div>}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Didn't receive the code?{" "}
            <span
              onClick={handleResendOtp}
              style={{
                color: "#007bff",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Resend it
            </span>
          </p>
        </div>

        <button
          onClick={() => setCurrentStep("email")}
          className="back-to-login"
          style={{ marginTop: "1rem" }}
        >
          ← Back to email entry
        </button>

        <button onClick={onBackToLogin} className="back-to-login">
          Back to Login
        </button>
      </div>
    );
  }

  // Email entry screen (default)
  return (
    <div className="forgot-password-container">
      <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
      <h2 className="forgot-password-title">Forgot Password</h2>
      <p className="forgot-password-text">
        Enter your email address and we'll send you a verification code to reset
        your password.
      </p>

      <form className="forgot-password-form" onSubmit={handleEmailSubmit}>
        <input
          type="email"
          placeholder="Email address"
          className="login-input"
          value={email}
          onChange={handleEmailChange}
          required
        />

        {errorMessage && <div className="error-msg">{errorMessage}</div>}

        <button type="submit" className="login-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Sending Code...
            </>
          ) : (
            "Send Verification Code"
          )}
        </button>
      </form>

      <button onClick={onBackToLogin} className="back-to-login">
        Back to Login
      </button>
    </div>
  );
};

export default ForgotPassword;
