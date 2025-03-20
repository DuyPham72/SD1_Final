// frontend/src/pages/CallNurse.js
import React from "react";
import { useNavigate } from "react-router-dom";

function CallNurse() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Call Nurse</h1>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}

export default CallNurse;
