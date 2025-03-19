// usePatientData.js - Updated with localStorage persistence
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Make sure this path is correct

// Add a simple caching mechanism
let patientCache = {};

// Storage key for selected patient
const SELECTED_PATIENT_STORAGE_KEY = 'selectedPatientId';

export function usePatientData() {
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  // Initialize from localStorage if available
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    const storedId = localStorage.getItem(SELECTED_PATIENT_STORAGE_KEY);
    return storedId || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get auth context to access mode
  const { mode, nurseSelectedPatientId } = useAuth();

  // Persist selectedPatientId to localStorage when it changes
  useEffect(() => {
    if (selectedPatientId) {
      localStorage.setItem(SELECTED_PATIENT_STORAGE_KEY, selectedPatientId);
      console.log('Saved patient ID to localStorage:', selectedPatientId);
    }
  }, [selectedPatientId]);

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
        
        // Selection logic based on mode and whether we already have a selectedPatientId
        if (data.length > 0 && !selectedPatientId) {
          let patientToSelect;
          
          if (mode === 'patient') {
            // In patient mode, always select first patient by default
            console.log('Patient mode: Setting default patient to first patient');
            patientToSelect = data[0].patientId;
          } else if (mode === 'staff' && nurseSelectedPatientId) {
            // In staff mode, use nurse selected patient if available
            // Check if nurseSelectedPatientId exists in the data
            const nursePatientExists = data.some(p => p.patientId === nurseSelectedPatientId);
            if (nursePatientExists) {
              console.log('Staff mode: Using nurse-selected patient:', nurseSelectedPatientId);
              patientToSelect = nurseSelectedPatientId;
            } else {
              // Fallback to first patient if nurse-selected doesn't exist
              console.log('Staff mode: Nurse-selected patient not found, using first patient');
              patientToSelect = data[0].patientId;
            }
          } else {
            // Default case, use first patient
            console.log('Default case: Setting to first patient');
            patientToSelect = data[0].patientId;
          }
          
          setSelectedPatientId(patientToSelect);
          // Also save to localStorage immediately
          localStorage.setItem(SELECTED_PATIENT_STORAGE_KEY, patientToSelect);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPatients();
  }, [mode, nurseSelectedPatientId, selectedPatientId]); // Include selectedPatientId as dependency

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

  // Handle patient change with explicit logging
  const handlePatientChange = useCallback((patientId) => {
    console.log('handlePatientChange called with patientId:', patientId);
    setSelectedPatientId(patientId);
    // Also save to localStorage immediately for extra safety
    localStorage.setItem(SELECTED_PATIENT_STORAGE_KEY, patientId);
  }, []);

  return { 
    patient, 
    setPatient: updatePatient,
    allPatients, 
    selectedPatientId,
    setSelectedPatientId, // Expose this for direct access if needed 
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