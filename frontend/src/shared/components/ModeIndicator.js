// src/shared/components/ModeIndicator.js
import React from "react";
import { useAuth } from "../hooks/AuthContext";
import "../../styles/ModeIndicator.css";

const ModeIndicator = () => {
  const { mode, user, logout } = useAuth();

  return (
    <div className={`mode-indicator ${mode}`}>
      <div className="mode-icon">{mode === "staff" ? "👩‍⚕️" : "📺"}</div>
      <div className="mode-info">
        <div className="mode-name">
          {mode === "staff" ? "Staff Mode" : "Patient Mode"}
        </div>
        <div className="user-info">
          {mode === "staff" && user && <span>{user.name}</span>}
          {mode === "staff" && (
            <button
              className="logout-button"
              onClick={logout}
              title="Return to Patient Mode"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModeIndicator;
