// src/shared/index.js
// Export hooks
export { usePatientData } from './hooks/usePatientData';
export { useTimeUpdate } from './hooks/useTimeUpdate';
export { useNavigationState } from './hooks/useNavigationState';
export { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
export { AuthProvider, useAuth } from './hooks/AuthContext';

// Export components
export {  Layout } from './components/Layout';
export {  Header } from './components/Header';
export { default as LoginModal } from './components/LoginModal';
export { default as ModeIndicator } from './components/ModeIndicator';