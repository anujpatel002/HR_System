'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

import { attendanceAPI } from '../../lib/api';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import CheckInModal from '../../components/CheckInModal';


export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  useSessionTimeout(720); // 12 hours


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const checkFirstLoginToday = async () => {
      if (!user || user.role === 'ADMIN') return;
      
      // Check work settings first
      try {
        const settingsResponse = await api.get('/settings/work');
        const settings = settingsResponse.data.data;
        
        if (!settings.checkInPopup) return;
        
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        // Only show popup during configured time window
        if (currentTime < settings.popupStartTime || currentTime > settings.popupEndTime) {
          return;
        }
        
        const lastCheckIn = localStorage.getItem('lastCheckInDate');
        const today = new Date().toDateString();
        
        if (lastCheckIn !== today) {
          try {
            const response = await attendanceAPI.getToday();
            if (!response.data.data?.checkIn) {
              setShowCheckInModal(true);
            }
          } catch (error) {
            setShowCheckInModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to check settings:', error);
      }
    };

    if (user && isAuthenticated) {
      checkFirstLoginToday();
    }
  }, [user, isAuthenticated]);

  const handleCheckIn = () => {
    localStorage.setItem('lastCheckInDate', new Date().toDateString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
      <CheckInModal 
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckIn={handleCheckIn}
      />

    </div>
  );
}