import { useState } from 'react';

export const useNavigationState = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
  const [mainNavFocusIndex, setMainNavFocusIndex] = useState(null);

  return {
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex
  };
};