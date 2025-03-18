// src/shared/Header.js
import React, { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import ModeIndicator from '../components/ModeIndicator';
import LoginModal from '../components/LoginModal';

export const Header = ({ 
  patient, 
  allPatients, 
  selectedPatientId, 
  onPatientChange,
  currentTime,
  isNavOpen,
  onNavToggle,
  mainNavElementsRef,
  mainNavFocusIndex,
  extraHeaderContent
}) => {
  const { mode, isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  return (
    <div className="header-bar">
      <button 
        ref={el => mainNavElementsRef.current.menuButton = el}
        className={`menu-button ${mainNavFocusIndex === 0 ? 'focused' : ''}`}
        onClick={onNavToggle}
      >
        ☰
      </button>
      <select 
        ref={el => mainNavElementsRef.current.patientSelector = el}
        className={`patient-selector ${mainNavFocusIndex === 1 ? 'focused' : ''}`}
        value={selectedPatientId}
        onChange={(e) => onPatientChange(e.target.value)}
      >
        {allPatients.map(p => (
          <option key={p.patientId} value={p.patientId}>
            {p.name} - Room {p.room}
          </option>
        ))}
      </select>
      <h1 className="patient-header">Patient Name: {patient?.name}</h1>
      
      <div className="header-actions">
        <ModeIndicator />
        
        {mode === 'patient' && (
          <button 
            className="staff-login-button"
            onClick={() => setIsLoginModalOpen(true)}
          >
            Staff Login
          </button>
        )}
        
        {isAuthenticated && extraHeaderContent}
      </div>
      
      <div className="current-time">
        <div>{currentTime.toLocaleDateString()}</div>
        <div>{currentTime.toLocaleTimeString()}</div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};