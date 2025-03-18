import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MainDashboard.css';
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header,
} from '../shared';

function MainDashboard() {
  const navigate = useNavigate();
  const { patient, allPatients, selectedPatientId, loading, handlePatientChange } = usePatientData();
  const currentTime = useTimeUpdate();
  const { 
    isNavOpen, 
    setIsNavOpen, 
    sidebarFocusIndex, 
    setSidebarFocusIndex,
    mainNavFocusIndex, 
    setMainNavFocusIndex 
  } = useNavigationState();

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null
  });
  const sidebarButtonsRef = useRef([]);

  // Hook up keyboard navigation
  useKeyboardNavigation({
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate,
    customHandlers: {
      Enter: (e) => {
        if (isNavOpen) {
          e.preventDefault();
          const selectedItem = sidebarButtonsRef.current[sidebarFocusIndex];
          if (selectedItem) {
            setIsNavOpen(false);
            setTimeout(() => {
              navigate(selectedItem.dataset.path);
            }, 10);
          }
        }
      }
    }
  });

  // Function to check if a schedule item is in the past
  const isTimeInPast = (scheduleTime) => {
    if (!scheduleTime) return false;
    
    const [timePart, ampm] = scheduleTime.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (ampm === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour > hour) {
      return true;
    } else if (currentHour === hour && currentMinute > minute) {
      return true;
    }
    
    return false;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

  const navItems = [
    { icon: '🏠', text: 'Home', path: '/' },
    { icon: '📋', text: 'Patient Status & Feedback', path: '/patient-info' },
    { icon: '📚', text: 'Library', path: '/library' },
    { icon: '🎮', text: 'Entertainment', path: '/entertainment' },
    { icon: '⚙️', text: 'Settings', path: '/settings' }
  ];

  return (
    <Layout
      patient={patient}
      isNavOpen={isNavOpen}
      onNavToggle={() => setIsNavOpen(!isNavOpen)}
      navItems={navItems}
      sidebarButtonsRef={sidebarButtonsRef}
    >
      <Header
        patient={patient}
        allPatients={allPatients}
        selectedPatientId={selectedPatientId}
        onPatientChange={handlePatientChange}
        currentTime={currentTime}
        isNavOpen={isNavOpen}
        onNavToggle={() => setIsNavOpen(!isNavOpen)}
        mainNavElementsRef={mainNavElementsRef}
        mainNavFocusIndex={mainNavFocusIndex}
      />

      <div className="content-container">
        {/* Left panel with patient info */}
        <div className="patient-info-panel">
          {/* Staff Info Card */}
          <div className="info-card">
            <div className="staff-item">
              <span className="staff-icon">👨‍⚕️</span>
              <span className="staff-label">Physician: {patient.careTeam.primaryDoctor}</span>
            </div>
            
            <div className="staff-item">
              <span className="staff-icon">👩‍⚕️</span>
              <span className="staff-label">Nurse: {patient.careTeam.primaryNurse}</span>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="info-card">
            <div className="patient-detail-item">
              <span className="detail-icon">🏠</span>
              <span className="detail-content">Room: {patient.room}</span>
            </div>
            
            <div className="patient-detail-item">
              <span className="detail-icon">🍽️</span>
              <span className="detail-content">Dietary: {patient.preferences.dietary.join(', ')}</span>
            </div>
            
            <div className="patient-detail-item">
              <span className="detail-icon">🗣️</span>
              <span className="detail-content">Language: {patient.preferences.language}</span>
            </div>
          </div>
        </div>

        {/* Right panel with schedule */}
        <div className="schedule-panel">
          <div className="info-card schedule-card">
            <h2>Today's Schedule:</h2>
            <div className="schedule-list">
              {patient.schedule && patient.schedule.length > 0 ? (
                patient.schedule.map((item, index) => (
                  <div 
                    key={index} 
                    className={`schedule-item ${isTimeInPast(item.time) ? 'past-activity' : ''}`}
                  >
                    <div className="time">{item.time}</div>
                    <div className="activity">
                      {item.activity}
                      {item.notes && <div className="notes">{item.notes}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-schedule">No scheduled activities for today</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MainDashboard;