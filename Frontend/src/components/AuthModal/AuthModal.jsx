import React, { useState } from "react";
import "./AuthModal.css";
import axios from "axios";

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Password: "",
    confirmpassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);

    axios
      .post("http://localhost:5000/api/v1/user/register", formData, {
        withCredentials: true,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
    setFormData({
      Name: "",
      Email: "",
      Password: "",
      confirmpassword: "",
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log(formData);

    axios
      .post("http://localhost:5000/api/v1/user/login", formData, {
        withCredentials: true,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
    setFormData({
      Email: "",
      Password: "",
    });
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchToSignup = () => {
    setMode("signup");
  };

  const switchToLogin = () => {
    setMode("login");
  };

  const switchToReset = () => {
    setMode("reset");
  };

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal-container">
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {mode === "reset" ? (
          <div className="auth-form">
            <h2 className="auth-title">Reset Password</h2>

            <p className="auth-description">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M3.33 5.833A2.5 2.5 0 015.833 3.33h8.334a2.5 2.5 0 012.5 2.5v8.333a2.5 2.5 0 01-2.5 2.5H5.833a2.5 2.5 0 01-2.5-2.5V5.833z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3.33 7.5l5.856 3.658a2 2 0 002.028 0L16.67 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="E-mail"
                  className="auth-input"
                />
              </div>
            </div>

            <button className="auth-submit-btn">Send Reset Link</button>

            <div className="auth-switch">
              <button onClick={switchToLogin}>Back to Login</button>
            </div>
          </div>
        ) : mode === "login" ? (
          <div className="auth-form">
            <h2 className="auth-title">Login</h2>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M3.33 5.833A2.5 2.5 0 015.833 3.33h8.334a2.5 2.5 0 012.5 2.5v8.333a2.5 2.5 0 01-2.5 2.5H5.833a2.5 2.5 0 01-2.5-2.5V5.833z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3.33 7.5l5.856 3.658a2 2 0 002.028 0L16.67 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="E-mail"
                  className="auth-input"
                  onChange={handleChange}
                  name="  Email"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="8.33"
                    width="10"
                    height="8.33"
                    rx="1.67"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6.67 8.33V5.833a3.33 3.33 0 116.66 0V8.33"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <input
                  type={showPassword ? "text" : "Password"}
                  placeholder="Password"
                  className="auth-input"
                  onChange={handleChange}
                  name="Password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M3.33 3.33l13.34 13.34M8.23 8.23a2.5 2.5 0 003.54 3.54"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.97 5.97C5.47 6.97 4.17 8.47 2.5 10c1.67 2.5 4.17 5 7.5 5 1.25 0 2.42-.42 3.53-1.03M13.47 11.47c.68-.88 1.2-1.88 1.86-2.97-1.67-2.5-4.17-5-7.5-5-.42 0-.83.05-1.23.13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-forgot">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  switchToReset();
                }}
              >
                Forgot your password?
              </a>
            </div>

            <button className="auth-submit-btn" onClick={handleLoginSubmit}>
              Sign in
            </button>

            <div className="auth-switch">
              <button onClick={switchToSignup}>Registration</button>
            </div>
          </div>
        ) : (
          <div className="auth-form">
            <h2 className="auth-title">Registration</h2>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <circle
                    cx="10"
                    cy="6.67"
                    r="3.33"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4.17 16.67a5.83 5.83 0 0111.66 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Name"
                  className="auth-input"
                  onChange={handleChange}
                  name="Name"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M3.33 5.833A2.5 2.5 0 015.833 3.33h8.334a2.5 2.5 0 012.5 2.5v8.333a2.5 2.5 0 01-2.5 2.5H5.833a2.5 2.5 0 01-2.5-2.5V5.833z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3.33 7.5l5.856 3.658a2 2 0 002.028 0L16.67 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="E-mail"
                  onChange={handleChange}
                  name="Email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="8.33"
                    width="10"
                    height="8.33"
                    rx="1.67"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6.67 8.33V5.833a3.33 3.33 0 116.66 0V8.33"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <input
                  type={showPassword ? "text" : "Password"}
                  placeholder="Password"
                  onChange={handleChange}
                  name="Password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <svg
                  className="auth-input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="8.33"
                    width="10"
                    height="8.33"
                    rx="1.67"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6.67 8.33V5.833a3.33 3.33 0 116.66 0V8.33"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "Password"}
                  placeholder="Confirm password"
                  className="auth-input"
                  onChange={handleChange}
                  name="confirmPassword"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="auth-submit-btn" onClick={handleSubmit}>
              Sing up
            </button>

            <div className="auth-switch">
              <button onClick={switchToLogin}>I have an account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
