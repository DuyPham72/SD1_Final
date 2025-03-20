// src/shared/components/LoginModal.js
import React, { useState, useRef, useEffect } from "react";
import "../../styles/LoginModal.css";
import { useAuth } from "../hooks/AuthContext";

const LoginModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  const { loginStaff } = useAuth();

  // Focus on the username input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    // For demonstration purposes, we'll use hardcoded credentials
    // In a real application, this would make an API call to validate
    setTimeout(() => {
      if (username === "staff" && password === "password") {
        loginStaff({
          id: 1,
          username: "staff",
          name: "Staff Member",
          role: "nurse",
        });
        onClose();
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 1000);
  };

  // Handle keydown events for accessibility
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onKeyDown={handleKeyDown}>
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2>Staff Login</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
