import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Entertainment.css";
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header,
} from "../shared";
import youtubeIcon from "../assets/youtube.png";
import spotifyIcon from "../assets/spotify.png";
import netflixIcon from "../assets/netflix.png";
import twitchIcon from "../assets/twitch.png";

function Entertainment() {
  const navigate = useNavigate();
  const {
    patient,
    allPatients,
    selectedPatientId,
    loading,
    handlePatientChange,
  } = usePatientData();
  const currentTime = useTimeUpdate();
  const {
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
  } = useNavigationState();

  // References for keyboard navigation
  const appRefs = useRef([]);
  const mainNavElementsRef = useRef({
    menuButton: null,
    entertainmentButton: null,
  });
  const sidebarButtonsRef = useRef([]);

  // Entertainment options
  const entertainmentOptions = [
    { name: "YouTube", icon: youtubeIcon, url: "https://www.youtube.com" },
    { name: "Spotify", icon: spotifyIcon, url: "https://www.spotify.com" },
    { name: "Netflix", icon: netflixIcon, url: "https://www.netflix.com" },
    { name: "Twitch", icon: twitchIcon, url: "https://www.twitch.tv" },
  ];

  // Use the enhanced keyboard navigation with entertainment support
  const {
    focusedAppIndex,
    isEntertainmentMode,
    handleIconFocus,
    handleIconKeyDown,
  } = useKeyboardNavigation({
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate,
    // Entertainment-specific params
    isEntertainmentPage: true,
    appRefs,
    entertainmentOptions,
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
          <h2 id="entertainment-heading">More Entertainment</h2>
          <div
            className="entertainment-icons"
            role="navigation"
            aria-labelledby="entertainment-heading"
          >
            {entertainmentOptions.map((option, index) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${option.name} (use arrow keys to navigate)`}
                tabIndex={
                  isEntertainmentMode || index === focusedAppIndex ? 0 : -1
                }
                ref={(el) => (appRefs.current[index] = el)}
                onKeyDown={(e) => handleIconKeyDown(e, index, option.url)}
                className={`entertainment-link ${
                  focusedAppIndex === index ? "app-focused" : ""
                }`}
                onFocus={() => handleIconFocus(index)}
                onMouseOver={() => handleIconFocus(index)}
              >
                <img
                  src={option.icon}
                  alt={option.name}
                  className="entertainment-icon"
                />
              </a>
            ))}
          </div>
          <p className="keyboard-hint">
            Press arrow keys to navigate, Enter to select
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Entertainment;
