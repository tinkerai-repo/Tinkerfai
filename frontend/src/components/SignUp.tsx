import React, { useState } from "react";
import "./SignUp.css";
import logo from "../assets/tinkerfai-logo.png";
import { API_BASE_URL } from "../config";
import googleIcon from "../assets/google_icon.png";

interface SignUpProps {
  onSignInClick: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignInClick }) => {
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // UI states
  const [experience, setExperience] = useState(2);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const experienceDescriptions = [
    "Just starting to explore the world of coding",
    "Comfortable with code and enjoy building things",
    "Skilled developer who can tackle complex projects",
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend password validation
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show OTP verification step
        setIsOtpStep(true);
      } else {
        // Display error from backend
        setErrorMessage(data.detail || data.message || "Registration failed");
      }
    } catch (error) {
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/confirm-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          confirmationCode: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message
        setIsSuccess(true);

        // Redirect to signin after 2 seconds
        setTimeout(() => {
          onSignInClick();
        }, 2000);
      } else {
        setErrorMessage(data.detail || data.message || "Verification failed");
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
      const response = await fetch(`${API_BASE_URL}/resend-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setErrorMessage(""); // Clear any errors
        // You could show a success message here if needed
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
  if (isSuccess) {
    return (
      <div className="signup-card success-message">
        <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h3>Account Created Successfully!</h3>
          <p>Your account has been verified. Redirecting to sign in...</p>
          <div className="spinner" style={{ margin: "1rem auto" }}></div>
        </div>
      </div>
    );
  }

  // OTP verification screen
  if (isOtpStep) {
    return (
      <div className="signup-card">
        <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
        <h3>Verify Your Email</h3>
        <p
          style={{ textAlign: "center", marginBottom: "1.5rem", color: "#666" }}
        >
          We've sent a verification code to
          <br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleOtpVerification}>
          <input
            type="text"
            placeholder="Enter 6-digit verification code"
            maxLength={6}
            required
            value={otpCode}
            onChange={(e) => {
              setOtpCode(e.target.value);
              setErrorMessage("");
            }}
            style={{
              textAlign: "center",
              fontSize: "1.2rem",
              letterSpacing: "0.2rem",
            }}
          />

          {errorMessage && <div className="error-msg">{errorMessage}</div>}

          <button
            type="submit"
            className="create-account-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              "Verify Account"
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

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <span
            onClick={() => setIsOtpStep(false)}
            style={{
              color: "#666",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            ← Back to sign up
          </span>
        </div>
      </div>
    );
  }

  // Main signup form
  return (
    <div className="signup-card">
      <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
      <h3>Create an Account</h3>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="First name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password (8+ characters)"
            minLength={8}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setErrorMessage("");
            }}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            {showPassword ? "👁️" : "🙈"}
          </span>
        </div>
        <small>Password must be at least 8 characters long.</small>

        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
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

        <label className="slider-label">Your coding experience:</label>
        <div className="slider-section">
          <input
            type="range"
            min="0"
            max="2"
            className="slider"
            value={experience}
            onChange={(e) => setExperience(Number(e.target.value))}
          />
          <div className="slider-labels">
            <span className={experience === 0 ? "active-label" : ""}>
              Curious
              <br />
              Beginner
            </span>
            <span className={experience === 1 ? "active-label" : ""}>
              Code
              <br />
              Adventurer
            </span>
            <span className={experience === 2 ? "active-label" : ""}>
              Master
              <br />
              Tinkerer
            </span>
          </div>
          <div className="slider-desc">
            <em>{experienceDescriptions[experience]}</em>
          </div>
        </div>

        <button
          type="submit"
          className="create-account-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="or-divider-alt">
        <span>or</span>
      </div>
      <button className="google-signup-btn" aria-label="Sign up with Google">
        <img src={googleIcon} alt="Google" className="google-img-icon" /> Sign
        up with Google
      </button>

      <div className="signin-link">
        Already have an account? <span onClick={onSignInClick}>Sign in</span>
      </div>
    </div>
  );
};

export default SignUp;
