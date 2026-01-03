'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SessionWarningModal({ onExtend, onLogout }) {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    // Show warning after 7 minutes (12 min session - 5 min warning)
    const timer = setTimeout(() => setShow(true), 7 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [show, onLogout]);

  const handleExtend = () => {
    setShow(false);
    setCountdown(300);
    onExtend();
  };

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Session Expiring Soon</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Your session will expire in{' '}
          <span className="font-bold text-red-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Click "Stay Logged In" to continue your session, or "Logout" to end your session now.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExtend}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
