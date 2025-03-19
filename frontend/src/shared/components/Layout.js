// src/shared/components/Layout.js
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import '../../styles/Sidebar.css';

export const Layout = ({ 
  children, 
  patient, 
  isNavOpen, 
  onNavToggle, 
  navItems, // Use passed navItems if available
  sidebarButtonsRef 
}) => {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const { mode } = useAuth();
  
  // Define navigation items based on user mode
  const getNavItems = () => {
    // If specific navItems were passed as props, use those
    if (navItems && navItems.length > 0) {
      return navItems;
    }
    
    // Otherwise, use role-based navigation
    if (mode === 'staff') {
      // Staff can only access patient info and settings
      return [
        { icon: '📋', text: 'Patient Info', path: '/patient-info' },
        { icon: '⚙️', text: 'Settings', path: '/settings' }
      ];
    } else {
      // Patients can only access home, entertainment, and feedback
      return [
        { icon: '🏠', text: 'Home', path: '/' },
        { icon: '🎮', text: 'Entertainment', path: '/entertainment' },
        { icon: '📝', text: 'Patient Feedback', path: '/feedback' }
      ];
    }
  };
  
  const finalNavItems = getNavItems();

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isNavOpen) {
        onNavToggle();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavOpen, onNavToggle]);

  // Handle body class for preventing scroll on mobile
  useEffect(() => {
    if (isNavOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isNavOpen]);

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
          <button className="close-sidebar" onClick={onNavToggle}>×</button>
        </div>
        <nav className="sidebar-nav">
          {finalNavItems.map((item, index) => (
            <button 
              key={item.path}
              ref={el => sidebarButtonsRef.current[index] = el}
              className="nav-item"
              onClick={() => handleNavigate(item.path)}
              tabIndex={isNavOpen ? 0 : -1}
              data-path={item.path}
            >
              <span className="nav-icon">{item.icon}</span> 
              <span className="nav-text">{item.text}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className={`main-content ${isNavOpen ? 'sidebar-open' : ''}`}>
        {children}
      </div>

      {isNavOpen && (
        <div className="overlay" onClick={onNavToggle} />
      )}
    </div>
  );
};

export default Layout;