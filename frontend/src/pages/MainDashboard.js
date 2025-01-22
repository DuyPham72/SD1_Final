import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [careTeam, setCareTeam] = useState({
    nurse: "RN Sarah",
    doctor: "Dr. Smith"
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard">
      {/* Header with Time and Care Team */}
      <header className="dashboard-header">
        <div className="datetime-display">
          <div className="date">{currentTime.toLocaleDateString()}</div>
          <div className="time">{currentTime.toLocaleTimeString()}</div>
        </div>
        <div className="care-team">
          <div>Nurse: {careTeam.nurse}</div>
          <div>Doctor: {careTeam.doctor}</div>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Patient Input Section */}
        <section className="patient-input">
          <h2>Share Your Thoughts & Needs</h2>
          <div className="input-buttons">
            <button onClick={() => navigate('/patient-info')} className="large-button">
              Personal Preferences
            </button>
            <button className="large-button">Daily Journal</button>
            <button onClick={() => navigate('/call-nurse')} className="large-button">
              Request Assistance
            </button>
          </div>
        </section>

        {/* Quick Access Menu */}
        <nav className="quick-access">
          <button onClick={() => navigate('/entertainment')} className="menu-button">
            Entertainment
          </button>
          <button onClick={() => navigate('/patient-info')} className="menu-button">
            My Information
          </button>
          <button onClick={() => navigate('/call-nurse')} className="menu-button">
            Call Nurse
          </button>
          <button onClick={() => navigate('/settings')} className="menu-button">
            Settings
          </button>
        </nav>
      </main>
    </div>
  );
}

export default MainDashboard;