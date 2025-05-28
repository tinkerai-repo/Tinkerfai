import React, { useState, useEffect } from "react";
import "./Login.css";
import logo from "./assets/tinkerfai-logo.png";
import puzzleBg from "./assets/close-up-puzzle-background.jpg";
import ForgotPassword from "./ForgotPassword";
import SignUp from "./SignUp";
import googleIcon from "./assets/google_icon.png";

const Login = () => {
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Create a new image object
    const img = new Image();

    // Set up loading handlers
    img.onload = () => {
      setIsBgLoaded(true);
      document.querySelector(".puzzle-bg")?.classList.add("loaded");
    };

    img.onerror = () => {
      console.error("Failed to load background image");
    };

    // Start loading the image
    img.src = puzzleBg;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError("");
    setErrorMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError("");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens in localStorage
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("idToken", data.data.idToken);
        localStorage.setItem("userInfo", JSON.stringify(data.data.user));

        // Show success state
        setIsSuccess(true);

        // TODO: Redirect to dashboard/home page
        setTimeout(() => {
          console.log("Redirect to dashboard");
          // window.location.href = '/dashboard'; // Uncomment when you have dashboard
        }, 1500);
      } else {
        // Display error from backend
        setErrorMessage(data.detail || data.message || "Sign in failed");
      }
    } catch (error) {
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignUp(true);
  };

  const handleSignInClick = () => {
    setShowSignUp(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="puzzle-bg">
        <div
          className="login-container success-message"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
          <div style={{ marginTop: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h3>Welcome Back!</h3>
            <p>Sign in successful. Redirecting to your dashboard...</p>
            <div className="spinner" style={{ margin: "1rem auto" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-bg">
      {showSignUp ? (
        <div className="centered-auth">
          <SignUp onSignInClick={handleSignInClick} />
        </div>
      ) : (
        <>
          <div
            className={`login-container ${showForgotPassword ? "hidden" : ""}`}
          >
            <img src={logo} alt="TinkerFAI Logo" className="login-logo" />
            <form className="login-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email address"
                className="login-input"
                value={email}
                onChange={handleEmailChange}
                required
              />
              {emailError && <div className="error-msg">{emailError}</div>}

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="login-input"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>
              {passwordError && (
                <div className="error-msg">{passwordError}</div>
              )}

              {errorMessage && <div className="error-msg">{errorMessage}</div>}

              <div className="login-options">
                <div></div> {/* Empty div to maintain spacing */}
                <a
                  href="#"
                  className="forgot-password"
                  onClick={handleForgotPasswordClick}
                >
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="or-divider-alt">
              <span>or</span>
            </div>

            <button
              className="google-signup-btn"
              type="button"
              title="Sign in with Google"
            >
              <img src={googleIcon} alt="Google" className="google-img-icon" />{" "}
              Sign in with Google
            </button>

            <div className="signup-text">
              Not a member?{" "}
              <a href="#" className="signup-link" onClick={handleSignUpClick}>
                Sign up now
              </a>
            </div>
          </div>

          <div
            className={`forgot-password-container ${
              !showForgotPassword ? "hidden" : ""
            }`}
          >
            <ForgotPassword onBackToLogin={handleBackToLogin} />
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
