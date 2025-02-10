import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TVMode.css';

function MainDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all patients' data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/patients');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllPatients(data);
        // Set first patient as default
        setPatient(data[0]);
        setSelectedPatientId(data[0].patientId);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handlePatientChange = (patientId) => {
    const selected = allPatients.find(p => p.patientId === patientId);
    setSelectedPatientId(patientId);
    setPatient(selected);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${isNavOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="room-info">Room #{patient.room}</div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/')}>
            🏠 Home
          </button>
          <button className="nav-item" onClick={() => navigate('/status')}>
            📋 Patient Status & Feedback
          </button>
          <button className="nav-item" onClick={() => navigate('/library')}>
            📚 Library
          </button>
          <button className="nav-item" onClick={() => navigate('/entertainment')}>
            🎮 Entertainment
          </button>
          <button className="nav-item" onClick={() => navigate('/settings')}>
            ⚙️ Settings
          </button>
        </nav>
      </div>

      <div className="main-content">
        {/* Header Bar */}
        <div className="header-bar">
          <button className="menu-button" onClick={() => setIsNavOpen(!isNavOpen)}>
            ☰
          </button>
          <select 
            className="patient-selector"
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
          >
            {allPatients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} - Room {p.room}
              </option>
            ))}
          </select>
          <h1 className="patient-header">Patient Name: {patient.name}</h1>
          <div className="current-time">
            <div>{currentTime.toLocaleDateString()}</div>
            <div>{currentTime.toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="content-container">
          {/* Patient Info Card */}
          <div className="info-card">
            <div className="staff-info">
              <div className="staff-member">
                👨‍⚕️ <span>Physician: {patient.careTeam.primaryDoctor}</span>
              </div>
              <div className="staff-member">
                👩‍⚕️ <span>Nurse: {patient.careTeam.primaryNurse}</span>
              </div>
            </div>

            <div className="patient-details">
              <div>Room: {patient.room}</div>
              <div>Dietary: {patient.preferences.dietary.join(', ')}</div>
              <div>Language: {patient.preferences.language}</div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="info-card">
            <h2>Today's Schedule:</h2>
            <div className="schedule-list">
              <div className="schedule-item">
                <div className="time">10:00 AM</div>
                <div className="activity">Physical Therapy</div>
              </div>
              <div className="schedule-item">
                <div className="time">12:00 PM</div>
                <div className="activity">Lunch: {patient.preferences.dietary.join(', ')}</div>
              </div>
              <div className="schedule-item">
                <div className="time">1:00 PM</div>
                <div className="activity">Doctor's Check-in</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for when sidebar is open */}
      {isNavOpen && (
        <div className="overlay" onClick={() => setIsNavOpen(false)} />
      )}
    </div>
  );
}

export default MainDashboard;