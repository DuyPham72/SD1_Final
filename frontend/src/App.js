// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import PatientInfo from './pages/PatientInfo';
import Entertainment from './pages/Entertainment';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';
import { AuthProvider, useAuth } from './shared';

// Debug component to display current auth state
const DebugAuthStatus = () => {
  const { mode, isAuthenticated, user } = useAuth();
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: '#333', 
      color: 'white', 
      padding: '5px 10px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      Mode: {mode} | Auth: {isAuthenticated ? 'Yes' : 'No'}
      {user && ` | User: ${user.name}`}
    </div>
  );
};

// Main app with routes
function AppWithRoutes() {
  const { mode } = useAuth();
  
  console.log("Current mode:", mode);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/patient-info" element={<PatientInfo />} />
        <Route path="/entertainment" element={<Entertainment />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/feedback" element={<Feedback />} />
        
        {/* Default redirect based on mode */}
        <Route path="*" element={
          <Navigate to={mode === 'staff' ? '/patient-info' : '/'} replace />
        } />
      </Routes>
      
      <DebugAuthStatus />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppWithRoutes />
    </AuthProvider>
  );
}

export default App;