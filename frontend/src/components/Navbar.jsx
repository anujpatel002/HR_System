'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell } from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/auth/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">WorkZen</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {user?.role === 'EMPLOYEE' && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">1</span>
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                    
                    {user?.role === 'EMPLOYEE' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <h4 className="text-xs font-medium text-yellow-800">Bank Details Required</h4>
                            <p className="text-xs text-yellow-700 mt-1">
                              Add your bank details to receive payroll payments.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user?.role !== 'EMPLOYEE' && (
                      <p className="text-sm text-gray-500">No new notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                {user?.role === 'EMPLOYEE' && user?.managerName && (
                  <span className="text-xs text-gray-500">Manager: {user.managerName}</span>
                )}
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}