// Modified ModeIndicator.js
import React from "react";
import { useAuth } from "../hooks/AuthContext";
import "../../styles/ModeIndicator.css";

const ModeIndicator = () => {
  const { mode, user, logout } = useAuth();

  // Don't render anything if in patient mode
  if (mode === "patient") {
    return null;
  }

  return (
    <div className="mode-indicator staff">
      <div className="mode-icon">👩‍⚕️</div>
      <div className="mode-info">
        <div className="mode-name">Staff Mode</div>
        <div className="user-info">
          {user && <span>{user.name}</span>}
          <button
            className="logout-button"
            onClick={logout}
            title="Return to Patient Mode"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeIndicator;