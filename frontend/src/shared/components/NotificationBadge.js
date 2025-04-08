import React, { useState, useRef, useEffect } from 'react';
import '../../styles/NotificationBadge.css';
import axios from 'axios';

function NotificationBadge() {
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/notifications'); // Adjust URL for production
      setNotifications(res.data.map((n) => `${n.message} at ${n.time}`));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllRead = async () => {
    await axios.post('http://localhost:3000/api/notifications/read');
    setNotifications([]);
  };

  const togglePopup = () => {
    setShowPopup((prev) => !prev);
    if (!showPopup) {
      fetchNotifications();
    }
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
            <button onClick={markAllRead}>Mark All as Read</button>
          </ul>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
    </div>
  );
}


export default NotificationBadge;