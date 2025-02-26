import { useState, useEffect } from 'react';
export const useTimeUpdate = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
  
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
  
    return currentTime;
  };