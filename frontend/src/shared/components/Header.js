import React from 'react';

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
}) => (
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
    {extraHeaderContent}
    <div className="current-time">
      <div>{currentTime.toLocaleDateString()}</div>
      <div>{currentTime.toLocaleTimeString()}</div>
    </div>
  </div>
);