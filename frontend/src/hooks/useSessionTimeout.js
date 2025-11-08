import { useEffect, useRef } from 'react';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export const useSessionTimeout = (timeoutMinutes = 720) => { // 12 hours = 720 minutes
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Warning 30 minutes before timeout
    warningRef.current = setTimeout(() => {
      toast('Session will expire in 30 minutes due to inactivity', {
        duration: 10000,
        icon: '⚠️'
      });
    }, (timeoutMinutes - 30) * 60 * 1000);

    // Auto logout after timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('token');
      toast.error('Session expired due to inactivity');
      window.location.href = '/auth/login';
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => resetTimeout();
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimeout(); // Start initial timeout

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [timeoutMinutes]);

  return resetTimeout;
};