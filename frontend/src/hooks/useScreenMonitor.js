import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '../lib/api';

export const useScreenMonitor = (user) => {
  const pathname = usePathname();

  useEffect(() => {
    if (!user || user.role === 'ADMIN') return;

    const updateScreen = async () => {
      try {
        await api.post('/screen-monitor/update', {
          currentPage: pathname,
          screenData: {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            title: document.title
          }
        });
      } catch (error) {
        console.error('Screen monitor update failed:', error);
      }
    };

    updateScreen();
    const interval = setInterval(updateScreen, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [pathname, user]);
};