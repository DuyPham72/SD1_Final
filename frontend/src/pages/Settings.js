// frontend/src/pages/Settings.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Settings</h1>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}

export default Settings;