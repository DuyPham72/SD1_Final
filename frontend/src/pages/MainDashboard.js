import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TVMode.css';

function MainDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
  const [mainNavFocusIndex, setMainNavFocusIndex] = useState(null);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const sidebarButtonsRef = useRef([]);
  const selectRef = useRef(null);
  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
  });

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
        if (data.length > 0) {
          setPatient(data[0]);
          setSelectedPatientId(data[0].patientId);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Automatically focus home button when sidebar opens
  useEffect(() => {
    if (isNavOpen && sidebarButtonsRef.current[0]) {
      sidebarButtonsRef.current[0].focus();
      setSidebarFocusIndex(0);
      setMainNavFocusIndex(null);
    }
  }, [isNavOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const mainNavElements = [
        mainNavElementsRef.current.menuButton,
        mainNavElementsRef.current.patientSelector
      ];

      // If sidebar is open
      if (isNavOpen) {
        const sidebarButtons = sidebarButtonsRef.current;
        if (!sidebarButtons || sidebarButtons.length === 0) return;

        switch(e.key) {
          case 'ArrowUp':
            e.preventDefault();
            setSidebarFocusIndex(prevIndex => {
              const newIndex = prevIndex > 0 ? prevIndex - 1 : sidebarButtons.length - 1;
              sidebarButtons[newIndex]?.focus();
              return newIndex;
            });
            break;

          case 'ArrowDown':
            e.preventDefault();
            setSidebarFocusIndex(prevIndex => {
              const newIndex = prevIndex < sidebarButtons.length - 1 ? prevIndex + 1 : 0;
              sidebarButtons[newIndex]?.focus();
              return newIndex;
            });
            break;

          case 'Enter':
            e.preventDefault();
            sidebarButtons[sidebarFocusIndex]?.click();
            break;

          case 'Escape':
            e.preventDefault();
            setIsNavOpen(false);
            break;
        }
        return;
      }

      // Main dashboard navigation when sidebar is closed
      switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setMainNavFocusIndex(prev => 
            prev === null || prev >= mainNavElements.length - 1 ? 0 : prev + 1
          );
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setMainNavFocusIndex(prev => 
            prev === null || prev <= 0 ? mainNavElements.length - 1 : prev - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (mainNavFocusIndex !== null) {
            const focusedElement = mainNavElements[mainNavFocusIndex];
            
            // Special handling for patient selector to open dropdown
            if (focusedElement === mainNavElementsRef.current.patientSelector) {
              // Open dropdown by focusing and triggering click
              try {
                focusedElement.focus();
                focusedElement.click();
                
                // Programmatically open the dropdown if needed
                if ('showPicker' in focusedElement) {
                  focusedElement.showPicker();
                }
              } catch (error) {
                console.error('Error opening dropdown:', error);
              }
            } else {
              focusedElement?.click();
            }
          }
          break;

        // Number key shortcuts
        case '1':
          navigate('/entertainment');
          break;
        case '2':
          navigate('/patient-info');
          break;
        case '3':
          navigate('/call-nurse');
          break;
        case '4':
          navigate('/settings');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarFocusIndex, mainNavFocusIndex, isNavOpen, navigate]);

  // Focus management for main nav elements
  useEffect(() => {
    const mainNavElements = [
      mainNavElementsRef.current.menuButton,
      mainNavElementsRef.current.patientSelector
    ];

    if (!isNavOpen && mainNavFocusIndex !== null && mainNavElements[mainNavFocusIndex]) {
      mainNavElements[mainNavFocusIndex].focus();
    }
  }, [mainNavFocusIndex, isNavOpen]);

  const handlePatientChange = (patientId) => {
    const selected = allPatients.find(p => p.patientId === patientId);
    setSelectedPatientId(patientId);
    setPatient(selected);
  };

  const handleMenuButtonClick = () => {
    setIsNavOpen(!isNavOpen);
    if (!isNavOpen) {
      setSidebarFocusIndex(0);
      setMainNavFocusIndex(null);
    }
  };

  const handlePatientSelectorClick = (e) => {
    // Ensure the dropdown gets focus
    e.target.focus();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${isNavOpen ? 'open' : ''}`}
      >
        <div className="sidebar-header">
          <div className="room-info">Room #{patient.room}</div>
        </div>
        <nav className="sidebar-nav">
          {[
            { icon: '🏠', text: 'Home', path: '/' },
            { icon: '📋', text: 'Patient Status & Feedback', path: '/status' },
            { icon: '📚', text: 'Library', path: '/library' },
            { icon: '🎮', text: 'Entertainment', path: '/entertainment' },
            { icon: '⚙️', text: 'Settings', path: '/settings' }
          ].map((item, index) => (
            <button 
              key={item.path}
              ref={el => sidebarButtonsRef.current[index] = el}
              className="nav-item" 
              onClick={() => navigate(item.path)}
              tabIndex={isNavOpen ? 0 : -1}
            >
              {item.icon} {item.text}
            </button>
          ))}
        </nav>
      </div>

      <div className="main-content">
        {/* Header Bar */}
        <div className="header-bar">
          <button 
            ref={el => mainNavElementsRef.current.menuButton = el}
            className={`menu-button ${mainNavFocusIndex === 0 ? 'focused' : ''}`}
            onClick={handleMenuButtonClick}
          >
            ☰
          </button>
          <select 
            ref={el => {
              mainNavElementsRef.current.patientSelector = el;
              selectRef.current = el;
            }}
            className={`patient-selector ${mainNavFocusIndex === 1 ? 'focused' : ''}`}
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
            onClick={handlePatientSelectorClick}
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

        {/* Navigation Instructions */}
        <div className="navigation-instructions">
          <p>Use ↑↓ arrows to navigate • Enter to select • Esc to go back</p>
          <p>Quick access: 1-Entertainment • 2-Info • 3-Nurse • 4-Settings</p>
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