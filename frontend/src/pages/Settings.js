import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TVMode.css';

function Settings() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
  const [mainNavFocusIndex, setMainNavFocusIndex] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize dark mode from localStorage, default to false if not set
    return localStorage.getItem('darkMode') === 'true';
  });

  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const sidebarButtonsRef = useRef([]);
  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
    darkModeToggle: null,
  });

  // Apply dark mode class to body and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Time update effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/patients');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllPatients(data);
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

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      const mainNavElements = [
        mainNavElementsRef.current.menuButton,
        mainNavElementsRef.current.patientSelector,
        mainNavElementsRef.current.darkModeToggle
      ];

      // Sidebar navigation (when open)
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

      // Main navigation handling
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
            
            // Special handling for different elements
            if (focusedElement === mainNavElementsRef.current.patientSelector) {
              try {
                focusedElement.focus();
                focusedElement.click();
                
                if ('showPicker' in focusedElement) {
                  focusedElement.showPicker();
                }
              } catch (error) {
                console.error('Error opening dropdown:', error);
              }
            } else if (focusedElement === mainNavElementsRef.current.darkModeToggle) {
              // Toggle dark mode
              setIsDarkMode(!isDarkMode);
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
  }, [sidebarFocusIndex, mainNavFocusIndex, isNavOpen, navigate, isDarkMode]);

  // Main navigation focus management
  useEffect(() => {
    const mainNavElements = [
      mainNavElementsRef.current.menuButton,
      mainNavElementsRef.current.patientSelector,
      mainNavElementsRef.current.darkModeToggle
    ];

    if (!isNavOpen && mainNavFocusIndex !== null && mainNavElements[mainNavFocusIndex]) {
      mainNavElements[mainNavFocusIndex].focus();
    }
  }, [mainNavFocusIndex, isNavOpen]);

  // Patient change handler
  const handlePatientChange = (patientId) => {
    const selected = allPatients.find(p => p.patientId === patientId);
    setSelectedPatientId(patientId);
    setPatient(selected);
  };

  // Menu button click handler
  const handleMenuButtonClick = () => {
    setIsNavOpen(!isNavOpen);
    if (!isNavOpen) {
      setSidebarFocusIndex(0);
      setMainNavFocusIndex(null);
    }
  };

  // Dark mode toggle handler
  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
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
            { icon: '📋', text: 'Patient Status & Feedback', path: '/patient-info' },
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
            ref={el => mainNavElementsRef.current.patientSelector = el}
            className={`patient-selector ${mainNavFocusIndex === 1 ? 'focused' : ''}`}
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
          <div className="info-card">
            <h2>System Settings</h2>
            <div className="settings-section">
              <div className="setting-option">
                <label htmlFor="dark-mode-toggle">Dark Mode</label>
                <button 
                  ref={el => mainNavElementsRef.current.darkModeToggle = el}
                  id="dark-mode-toggle"
                  className={`toggle-button ${mainNavFocusIndex === 2 ? 'focused' : ''} ${isDarkMode ? 'active' : ''}`}
                  onClick={handleDarkModeToggle}
                >
                  {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                </button>
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

export default Settings;