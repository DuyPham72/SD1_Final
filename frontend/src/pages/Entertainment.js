import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Entertainment.css';
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header
} from '../shared';
import youtubeIcon from '../assets/youtube.png';
import spotifyIcon from '../assets/spotify.png';
import netflixIcon from '../assets/netflix.png';
import twitchIcon from '../assets/twitch.png';

function Entertainment() {
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
    entertainmentButton: null
  });
  const sidebarButtonsRef = useRef([]);

  useKeyboardNavigation({
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;



  return (
    <Layout
      patient={patient}
      isNavOpen={isNavOpen}
      onNavToggle={() => setIsNavOpen(!isNavOpen)}
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

      <div className="entertainment-container">
        {/* Centered Entertainment Section */}
        <div className="entertainment-card">
          <h2>More Entertainment</h2>
          <div className="entertainment-icons">
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
              <img src={youtubeIcon} alt="YouTube" className="entertainment-icon" />
            </a>
            <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer">
              <img src={spotifyIcon} alt="Spotify" className="entertainment-icon" />
            </a>
            <a href="https://www.netflix.com" target="_blank" rel="noopener noreferrer">
              <img src={netflixIcon} alt="Netflix" className="entertainment-icon" />
            </a>
            <a href="https://www.twitch.tv" target="_blank" rel="noopener noreferrer">
              <img src={twitchIcon} alt="Twitch" className="entertainment-icon" />
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Entertainment;
