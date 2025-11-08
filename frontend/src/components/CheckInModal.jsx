'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { attendanceAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function CheckInModal({ isOpen, onClose, onCheckIn }) {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await attendanceAPI.mark('checkin');
      toast.success('Checked in successfully!');
      onCheckIn();
      onClose();
    } catch (error) {
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check In Required</h2>
          <p className="text-gray-600 mb-6">
            This is your first login today. Would you like to mark your attendance?
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking In...' : 'Check In Now'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}