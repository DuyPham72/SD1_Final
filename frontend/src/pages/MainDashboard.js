import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TVMode.css';

function MainDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch patient data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/patients');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div className="dashboard">
      {/* Header with Time */}
      <div className="dashboard-header">
        <div className="datetime-display">
          <h1>{currentTime.toLocaleDateString()}</h1>
          <h1>{currentTime.toLocaleTimeString()}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <h1 className="content-title">Patient Information</h1>
        
        {loading ? (
          <div className="loading">Loading patient data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="patient-grid">
            {patients.map((patient) => (
              <div key={patient.patientId} className="patient-card">
                <h2 className="patient-name">{patient.name}</h2>
                <div className="patient-details">
                  <div className="detail-row">
                    <strong>Room:</strong> {patient.room}
                  </div>
                  <div className="detail-row">
                    <strong>Doctor:</strong> {patient.careTeam.primaryDoctor}
                  </div>
                  <div className="detail-row">
                    <strong>Nurse:</strong> {patient.careTeam.primaryNurse}
                  </div>
                  <div className="preferences-section">
                    <div className="detail-row">
                      <strong>Dietary:</strong> {patient.preferences.dietary.join(', ')}
                    </div>
                    <div className="detail-row">
                      <strong>Religious:</strong> {patient.preferences.religious}
                    </div>
                    <div className="detail-row">
                      <strong>Language:</strong> {patient.preferences.language}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="navigation">
          <button 
            className="nav-button"
            onClick={() => navigate('/entertainment')}
          >
            Entertainment
          </button>
          <button 
            className="nav-button"
            onClick={() => navigate('/patient-info')}
          >
            More Info
          </button>
          <button 
            className="nav-button"
            onClick={() => navigate('/call-nurse')}
          >
            Call Nurse
          </button>
          <button 
            className="nav-button"
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;