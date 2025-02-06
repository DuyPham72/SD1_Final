import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientInfo() {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/patients');
      const data = await response.json();
      setPatientData(data[0]);
      setEditedData(data[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${editedData.patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPatientData(updatedData);
        setEditing(false);
        // Refetch to update all components
        fetchPatientData();
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleChange = (section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (!patientData) return <div>No patient data available</div>;

  return (
    <div className="patient-info-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <h1>Detailed Patient Information</h1>
        {!editing ? (
          <button className="edit-button" onClick={handleEdit}>Edit Information</button>
        ) : (
          <button className="save-button" onClick={handleSave}>Save Changes</button>
        )}
      </div>

      <div className="detailed-info">
        {/* Personal Information */}
        <section className="info-section">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Room Number:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.room}
                  onChange={(e) => handleChange('room', '', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.room}</span>
              )}
            </div>
          </div>
        </section>

        {/* Care Team */}
        <section className="info-section">
          <h2>Care Team</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Primary Doctor:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.careTeam.primaryDoctor}
                  onChange={(e) => handleChange('careTeam', 'primaryDoctor', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.careTeam.primaryDoctor}</span>
              )}
            </div>
            <div className="info-item">
              <label>Primary Nurse:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.careTeam.primaryNurse}
                  onChange={(e) => handleChange('careTeam', 'primaryNurse', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.careTeam.primaryNurse}</span>
              )}
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="info-section">
          <h2>Patient Preferences</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Dietary Restrictions:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.preferences.dietary.join(', ')}
                  onChange={(e) => handleChange('preferences', 'dietary', e.target.value.split(', '))}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.preferences.dietary.join(', ')}</span>
              )}
            </div>
            <div className="info-item">
              <label>Religious Preference:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.preferences.religious}
                  onChange={(e) => handleChange('preferences', 'religious', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.preferences.religious}</span>
              )}
            </div>
            <div className="info-item">
              <label>Language:</label>
              {editing ? (
                <input
                  type="text"
                  value={editedData.preferences.language}
                  onChange={(e) => handleChange('preferences', 'language', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{patientData.preferences.language}</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PatientInfo;