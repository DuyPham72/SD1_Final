// usePatientData.js - Place this in your shared folder
import { useState, useEffect, useCallback } from 'react';

// Add a simple caching mechanism
let patientCache = {};

export function usePatientData() {
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/patients`);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        setAllPatients(data);
        
        // Select first patient by default if none is selected
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].patientId);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Fetch selected patient data
  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchSelectedPatient = async () => {
      try {
        setLoading(true);
        
        // Check if we have a cached version that's recent
        const cachedPatient = patientCache[selectedPatientId];
        
        // Use the cached patient data if available and recent (less than 30 seconds old)
        if (cachedPatient && (Date.now() - cachedPatient.timestamp < 30000)) {
          setPatient(cachedPatient.data);
          setLoading(false);
          return;
        }
        
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/patients/${selectedPatientId}`);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the cache
        patientCache[selectedPatientId] = {
          data: data,
          timestamp: Date.now()
        };
        
        setPatient(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSelectedPatient();
  }, [selectedPatientId]);

  // Enhanced setPatient that also updates the cache
  const updatePatient = useCallback((updatedPatientData) => {
    if (!updatedPatientData || !updatedPatientData.patientId) return;
    
    // Update cache with the latest data
    patientCache[updatedPatientData.patientId] = {
      data: updatedPatientData,
      timestamp: Date.now()
    };
    
    // Update state
    setPatient(updatedPatientData);
    
    // Also update in the allPatients array if present
    setAllPatients(prevPatients => 
      prevPatients.map(p => 
        p.patientId === updatedPatientData.patientId ? {...p, ...updatedPatientData} : p
      )
    );
  }, []);

  // Function to update patient data on the server
  const updatePatientData = useCallback(async (updatedPatient) => {
    setLoading(true);
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE_URL}/api/patients/${updatedPatient.patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPatient),
      });

      if (!response.ok) {
        throw new Error(`Error updating patient data: ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state and cache
      updatePatient(data);
      
      console.log("Patient data updated successfully:", data);
      return data;
    } catch (error) {
      console.error("Failed to update patient data:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePatient]);

  // Handle patient change
  const handlePatientChange = useCallback((patientId) => {
    setSelectedPatientId(patientId);
  }, []);

  return { 
    patient, 
    setPatient: updatePatient,
    allPatients, 
    selectedPatientId, 
    loading, 
    error,
    handlePatientChange,
    updatePatientData, // Add the function to update patient data on the server
    invalidateCache: useCallback((patientId) => {
      if (patientId) {
        delete patientCache[patientId];
      } else {
        patientCache = {}; // Clear entire cache
      }
    }, [])
  };
}