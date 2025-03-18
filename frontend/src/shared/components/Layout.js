// src/shared/components/Layout.js
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

export const Layout = ({ 
  children, 
  patient, 
  isNavOpen, 
  onNavToggle, 
  sidebarButtonsRef 
}) => {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const { mode } = useAuth();
  
  // Define navigation items based on user mode
  const getNavItems = () => {
    if (mode === 'staff') {
      // Staff can only access patient info and settings
      return [
        { icon: '📋', text: 'Patient Info', path: '/patient-info' },
        { icon: '⚙️', text: 'Settings', path: '/settings' }
      ];
    } else {
      // Patients can only access home and entertainment
      return [
        { icon: '🏠', text: 'Home', path: '/' },
        { icon: '🎮', text: 'Entertainment', path: '/entertainment' },
        { icon: '📝', text: 'Patient Feedback', path: '/feedback' }
      ];
    }
  };
  
  const navItems = getNavItems();

  const handleNavigate = (path) => {
    // Close sidebar first, then navigate
    onNavToggle();
    setTimeout(() => {
      navigate(path);
    }, 10);
  };

  return (
    <div className="dashboard">
      <div ref={sidebarRef} className={`sidebar ${isNavOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="room-info">Room #{patient?.room}</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <button 
              key={item.path}
              ref={el => sidebarButtonsRef.current[index] = el}
              className="nav-item"
              onClick={() => handleNavigate(item.path)}
              tabIndex={isNavOpen ? 0 : -1}
              data-path={item.path}
            >
              {item.icon} {item.text}
            </button>
          ))}
        </nav>
      </div>

      <div className="main-content">
        {children}
      </div>

      {isNavOpen && (
        <div className="overlay" onClick={onNavToggle} />
      )}
    </div>
  );
};

export default Layout;