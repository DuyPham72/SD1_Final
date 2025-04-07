import React, { useState, useRef, useEffect } from 'react';
import '../../styles/NotificationBadge.css';

const NotificationBadge = ({ notifications }) => {
  const [showPopup, setShowPopup] = useState(false);
  const bellRef = useRef(null);

  const togglePopup = () => {
    setShowPopup((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (bellRef.current && !bellRef.current.contains(e.target)) {
      setShowPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={bellRef}>
      <button
        className="notification-icon"
        onClick={togglePopup}
        aria-label="Toggle Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {showPopup && (
        <div className="notification-popup">
          <h3>Notifications</h3>
          <ul>
            {notifications.length === 0 ? (
              <li>No new notifications</li>
            ) : (
              notifications.map((note, index) => (
                <li key={index}>{note}</li>
              ))
            )}
          </ul>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;