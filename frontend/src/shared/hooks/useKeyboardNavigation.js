import { useEffect, useCallback } from 'react';

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
  customHandlers = {}
}) => {
  const handleKeyDown = useCallback((e) => {
    const mainNavElements = Object.values(mainNavElementsRef.current).filter(Boolean);
    
    // Handle custom key handlers first
    if (customHandlers[e.key]) {
      customHandlers[e.key](e);
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
      case 'ArrowDown':
        e.preventDefault();
        setMainNavFocusIndex(prev => {
          const nextIndex = prev === null || prev >= mainNavElements.length - 1 ? 0 : prev + 1;
          mainNavElements[nextIndex]?.focus();
          return nextIndex;
        });
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
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
    customHandlers
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
};