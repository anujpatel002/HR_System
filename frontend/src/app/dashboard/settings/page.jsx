'use client';

import { useState, useEffect } from 'react';
import { Settings, Clock, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { isAdmin } from '../../../utils/roleGuards';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    workStartTime: '09:00',
    workEndTime: '17:00',
    workingDays: '1,2,3,4,5',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    checkInPopup: true,
    popupStartTime: '08:45',
    popupEndTime: '09:15'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/work');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/settings/work', settings);
      toast.success('Work settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can access settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Work Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Working Hours</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={settings.workStartTime}
                  onChange={(e) => handleChange('workStartTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={settings.workEndTime}
                  onChange={(e) => handleChange('workEndTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Start</label>
                <input
                  type="time"
                  value={settings.lunchBreakStart}
                  onChange={(e) => handleChange('lunchBreakStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lunch End</label>
                <input
                  type="time"
                  value={settings.lunchBreakEnd}
                  onChange={(e) => handleChange('lunchBreakEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Working Days</h2>
          </div>
          
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
              const dayNumber = index + 1;
              const isSelected = settings.workingDays.split(',').includes(dayNumber.toString());
              
              return (
                <label key={day} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const days = settings.workingDays.split(',').filter(d => d);
                      if (e.target.checked) {
                        days.push(dayNumber.toString());
                      } else {
                        const dayIndex = days.indexOf(dayNumber.toString());
                        if (dayIndex > -1) days.splice(dayIndex, 1);
                      }
                      handleChange('workingDays', days.join(','));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Check-in Popup Settings */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Check-in Popup Settings</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.checkInPopup}
                onChange={(e) => handleChange('checkInPopup', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Enable check-in popup for employees</span>
            </label>
            
            {settings.checkInPopup && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Popup Start Time</label>
                  <input
                    type="time"
                    value={settings.popupStartTime}
                    onChange={(e) => handleChange('popupStartTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Popup End Time</label>
                  <input
                    type="time"
                    value={settings.popupEndTime}
                    onChange={(e) => handleChange('popupEndTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}