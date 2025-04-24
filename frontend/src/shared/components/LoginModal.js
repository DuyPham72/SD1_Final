// src/shared/components/LoginModal.js
import React, { useState, useRef, useEffect } from "react";
import "../../styles/LoginModal.css";
import { useAuth } from "../hooks/AuthContext";

const LoginModal = ({ isOpen, onClose, isDualScreenLogin = false, onDualScreenEnable }) => {
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

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

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

    // Define doctor accounts
    const doctors = [
      {id: 1, username: "doctor1", name: "Dr. Smith", role: "doctor"},
      {id: 2, username: "doctor2", name: "Dr. Johnson", role: "doctor"},
      {id: 3, username: "doctor3", name: "Dr. Williams", role: "doctor"},
      {id: 4, username: "doctor4", name: "Dr. Davis", role: "doctor"},
      {id: 5, username: "nurse1", name: "Nurse Thompson", role: "nurse"},
      {id: 6, username: "staff", name: "Staff Member", role: "staff"}
    ];
    
    // Find the doctor with matching username
    const user = doctors.find(doc => doc.username === username);
    
    if (user && password === "password") {
      // Close modal immediately to update UI
      onClose();
      
      // Log in the user
      loginStaff({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });
      
      // If this is a dual screen login, also enable dual screen mode
      if (isDualScreenLogin && typeof onDualScreenEnable === 'function') {
        console.log("Enabling dual screen mode after successful login");
        onDualScreenEnable();
      }
    } else {
      setError("Invalid username or password");
      setLoading(false);
    }
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
          <h2>{isDualScreenLogin ? "Dual Screen Authentication" : "Staff Login"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          {isDualScreenLogin && (
            <p className="dual-screen-info">
              Please authenticate to enable dual screen mode. This will display the staff interface on this screen.
            </p>
          )}

          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="doctor1, doctor2, etc."
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
              placeholder="password"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : isDualScreenLogin ? "Enable Dual Screen" : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;