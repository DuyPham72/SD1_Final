// frontend/src/pages/Entertainment.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Entertainment() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Entertainment</h1>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}

export default Entertainment;