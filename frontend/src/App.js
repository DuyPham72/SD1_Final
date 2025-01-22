import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import Entertainment from './pages/Entertainment';
import PatientInfo from './pages/PatientInfo';
import CallNurse from './pages/CallNurse';
import Settings from './pages/Settings';
import './App.css';
import './styles/TVStyles.css';  // Add this import

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainDashboard />} />
          <Route path="/entertainment" element={<Entertainment />} />
          <Route path="/patient-info" element={<PatientInfo />} />
          <Route path="/call-nurse" element={<CallNurse />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;