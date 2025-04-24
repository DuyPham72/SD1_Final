import { useEffect, useCallback, useState } from 'react';

export const useKeyboardNavigation = ({
  isNavOpen,
  setIsNavOpen,
  sidebarFocusIndex,
  setSidebarFocusIndex,
  mainNavFocusIndex,
  setMainNavFocusIndex,
  mainNavElementsRef,
  sidebarButtonsRef,
  navigate,
  customHandlers = {},
  // New parameters for entertainment
  isEntertainmentPage = false,
  appRefs = { current: [] },
  entertainmentOptions = []
}) => {
  // Add state for entertainment navigation if on entertainment page
  const [focusedAppIndex, setFocusedAppIndex] = useState(-1);
  const [isEntertainmentMode, setIsEntertainmentMode] = useState(false);
  
  // Focus the entertainment app when focusedAppIndex changes
  useEffect(() => {
    if (isEntertainmentPage && focusedAppIndex >= 0 && appRefs.current[focusedAppIndex]) {
      appRefs.current[focusedAppIndex].focus();
    }
  }, [focusedAppIndex, appRefs, isEntertainmentPage]);

  const handleKeyDown = useCallback((e) => {
    const mainNavElements = Object.values(mainNavElementsRef.current).filter(Boolean);
    
    // Special handling for the entertainment page
    if (isEntertainmentPage) {
      // When in entertainment mode
      if (isEntertainmentMode) {
        switch(e.key) {
          case 'ArrowRight':
            e.preventDefault();
            // Move focus to next entertainment icon
            setFocusedAppIndex(prev => {
              const nextIndex = (prev + 1) % appRefs.current.length;
              return nextIndex;
            });
            return;
            
          case 'ArrowLeft':
            e.preventDefault();
            // Move focus to previous entertainment icon
            setFocusedAppIndex(prev => {
              const prevIndex = (prev - 1 + appRefs.current.length) % appRefs.current.length;
              return prevIndex;
            });
            return;
            
          case 'ArrowUp':
            e.preventDefault();
            // Move focus back to header
            setFocusedAppIndex(-1);
            setIsEntertainmentMode(false);
            setMainNavFocusIndex(0); // Focus on menu button
            mainNavElementsRef.current.menuButton?.focus();
            return;
            
          case 'ArrowDown':
            // Block arrow down in entertainment mode
            e.preventDefault();
            return;
            
          case 'Escape':
            e.preventDefault();
            // Move focus back to header
            setFocusedAppIndex(-1);
            setIsEntertainmentMode(false);
            setMainNavFocusIndex(0); // Focus on menu button
            mainNavElementsRef.current.menuButton?.focus();
            return;
            
          default:
            break;
        }
      }
      // When in header on entertainment page and Down is pressed
      else if (e.key === 'ArrowDown' && !isNavOpen) {
        // Check if we're currently focused in the header
        const activeElement = document.activeElement;
        const isInHeader = mainNavElements.includes(activeElement);
        
        if (isInHeader) {
          e.preventDefault();
          setFocusedAppIndex(0);
          setIsEntertainmentMode(true);
          return;
        }
      }
    }
    
    // Handle custom key handlers
    if (customHandlers[e.key] && customHandlers[e.key](e) === true) {
      return;
    }

    // Sidebar navigation when open
    if (isNavOpen) {
      const sidebarButtons = sidebarButtonsRef.current;
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSidebarFocusIndex(prevIndex => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : sidebarButtons.length - 1;
            sidebarButtons[newIndex]?.focus();
            return newIndex;
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          setSidebarFocusIndex(prevIndex => {
            const newIndex = prevIndex < sidebarButtons.length - 1 ? prevIndex + 1 : 0;
            sidebarButtons[newIndex]?.focus();
            return newIndex;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (sidebarFocusIndex !== null && sidebarButtons[sidebarFocusIndex]) {
            sidebarButtons[sidebarFocusIndex].click();
          }
          break;

        case 'Escape':
        case 'Backspace': // Add Backspace as another option for "back"
          e.preventDefault();
          setIsNavOpen(false);
          break;

        default:
          break;
      }
      return;
    }

    // Main navigation when sidebar is closed
    switch(e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setMainNavFocusIndex(prev => {
          const nextIndex = prev === null || prev >= mainNavElements.length - 1 ? 0 : prev + 1;
          mainNavElements[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'ArrowDown':
        // First check if a custom handler wants to take control
        if (customHandlers['ArrowDown'] && customHandlers['ArrowDown'](e) === true) {
          // Custom handler has taken care of it
          break;
        }
        
        e.preventDefault();
        setMainNavFocusIndex(prev => {
          const nextIndex = prev === null || prev >= mainNavElements.length - 1 ? 0 : prev + 1;
          mainNavElements[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'ArrowLeft':
        e.preventDefault();
        setMainNavFocusIndex(prev => {
          const nextIndex = prev === null || prev <= 0 ? mainNavElements.length - 1 : prev - 1;
          mainNavElements[nextIndex]?.focus();
          return nextIndex;
        });
        break;
        
      case 'ArrowUp':
        // First check if a custom handler wants to take control
        if (customHandlers['ArrowUp'] && customHandlers['ArrowUp'](e) === true) {
          // Custom handler has taken care of it
          break;
        }
        
        e.preventDefault();
        setMainNavFocusIndex(prev => {
          const nextIndex = prev === null || prev <= 0 ? mainNavElements.length - 1 : prev - 1;
          mainNavElements[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (mainNavFocusIndex === 0) {
          // Menu button - toggle sidebar
          setIsNavOpen(true);
          setSidebarFocusIndex(0);
          setTimeout(() => {
            sidebarButtonsRef.current[0]?.focus();
          }, 0);
        } else if (mainNavFocusIndex !== null) {
          const element = mainNavElements[mainNavFocusIndex];
          if (element) {
            // Execute the click
            element.click();
            
            // Handle dropdown/select elements 
            if (element.tagName.toLowerCase() === 'select') {
              try {
                element.showPicker?.();
              } catch (error) {
                console.error('Error opening dropdown:', error);
              }
            }
          }
        }
        break;

      default:
        break;
    }
  }, [
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate,
    customHandlers,
    // New dependencies for entertainment
    isEntertainmentPage,
    isEntertainmentMode,
    focusedAppIndex,
    appRefs
  ]);

  // Add mouse hover handling for main nav elements
  const handleMouseEnter = useCallback((e) => {
    const mainNavElements = Object.values(mainNavElementsRef.current).filter(Boolean);
    const target = e.currentTarget;
    
    // Find the index of the hovered element
    const index = mainNavElements.findIndex(el => el === target);
    if (index !== -1) {
      setMainNavFocusIndex(index);
      target.focus();
    }
  }, [mainNavElementsRef, setMainNavFocusIndex]);

  // Entertainment icon focus handler
  const handleIconFocus = useCallback((index) => {
    if (isEntertainmentPage) {
      setFocusedAppIndex(index);
      setIsEntertainmentMode(true);
    }
  }, [isEntertainmentPage]);

  // Entertainment icon keydown handler
  const handleIconKeyDown = useCallback((e, index, url) => {
    if (isEntertainmentPage && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [isEntertainmentPage]);

  // Add event listeners for mouse enter/hover on main nav elements
  useEffect(() => {
    const mainNavElements = Object.values(mainNavElementsRef.current).filter(Boolean);
    
    // Add hover listeners to all main nav elements
    mainNavElements.forEach(element => {
      if (element) {
        element.addEventListener('mouseenter', handleMouseEnter);
      }
    });
    
    return () => {
      // Clean up listeners
      mainNavElements.forEach(element => {
        if (element) {
          element.removeEventListener('mouseenter', handleMouseEnter);
        }
      });
    };
  }, [mainNavElementsRef, handleMouseEnter]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Return entertainment-related state and handlers if on entertainment page
  if (isEntertainmentPage) {
    return {
      // Return the entertainment-specific helpers
      focusedAppIndex,
      isEntertainmentMode,
      handleIconFocus,
      handleIconKeyDown
    };
  }
};