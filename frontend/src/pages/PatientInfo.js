// frontend/src/pages/PatientInfo.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function PatientInfo() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Patient Information</h1>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}

export default PatientInfo;