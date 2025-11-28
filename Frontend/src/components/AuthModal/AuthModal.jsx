import React, { useState } from "react";
import "./AuthModal.css";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://livebaz.com/api/v1';

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear errors when user types
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.Name || !formData.Email || !formData.Password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (formData.Password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.Password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/register`,
        {
          Name: formData.Name,
          Email: formData.Email,
          Password: formData.Password,
          confirmPassword: formData.confirmPassword,
        },
        { withCredentials: true }
      );

      console.log("Registration successful:", response.data);

      // Store token if provided
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      // Store user info
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      setSuccess("Registration successful! Redirecting...");
      setFormData({
        Name: "",
        Email: "",
        Password: "",
        confirmPassword: "",
      });

      // Close modal and reload after 1.5 seconds
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.Email || !formData.Password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/login`,
        {
          Email: formData.Email,
          Password: formData.Password,
        },
        { withCredentials: true }
      );

      console.log("Login successful:", response.data);

      // Store token if provided
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      // Store user info
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      setSuccess("Login successful! Redirecting...");
      setFormData({
        Name: "",
        Email: "",
        Password: "",
        confirmPassword: "",
      });

      // Close modal and reload after 1.5 seconds
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchToSignup = () => {
    setMode("signup");
    setError("");
    setSuccess("");
    setFormData({
      Name: "",
      Email: "",
      Password: "",
      confirmPassword: "",
    });
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
    setSuccess("");
    setFormData({
      Name: "",
      Email: "",
      Password: "",
      confirmPassword: "",
    });
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

        {mode === "login" ? (
          <div className="auth-form">
            <h2 className="auth-title">Login</h2>

            {error && <div className="auth-error-message">{error}</div>}
            {success && <div className="auth-success-message">{success}</div>}

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
                  name="Email"
                  value={formData.Email}
                  disabled={loading}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="auth-input"
                  onChange={handleChange}
                  name="Password"
                  value={formData.Password}
                  disabled={loading}
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

            <button
              className="auth-submit-btn"
              onClick={handleLoginSubmit}
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="small" /> : "Sign in"}
            </button>

            <div className="auth-switch">
              <button onClick={switchToSignup}>Registration</button>
            </div>
          </div>
        ) : (
          <div className="auth-form">
            <h2 className="auth-title">Registration</h2>

            {error && <div className="auth-error-message">{error}</div>}
            {success && <div className="auth-success-message">{success}</div>}

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
                  placeholder="username"
                  className="auth-input"
                  onChange={handleChange}
                  name="Name"
                  value={formData.Name}
                  disabled={loading}
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
                  value={formData.Email}
                  disabled={loading}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  onChange={handleChange}
                  name="Password"
                  className="auth-input"
                  value={formData.Password}
                  disabled={loading}
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="auth-input"
                  onChange={handleChange}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  disabled={loading}
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

            <button
              className="auth-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="small" /> : "Sign up"}
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
