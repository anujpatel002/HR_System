'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell, Menu } from 'lucide-react';
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
    <nav className="bg-white shadow-google border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Google-style logo */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-semibold text-primary-600">Work</span>
                <span className="text-2xl font-semibold text-accent-red">Zen</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Icon */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="h-5 w-5" />
                {user?.role === 'EMPLOYEE' && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-accent-red rounded-full"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-google-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                    
                    {user?.role === 'EMPLOYEE' && (
                      <div className="bg-yellow-50 border-l-4 border-accent-yellow rounded p-3 mb-2">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-accent-yellow" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">Bank Details Required</h4>
                            <p className="text-sm text-gray-700 mt-1">
                              Add your bank details to receive payroll payments.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user?.role !== 'EMPLOYEE' && (
                      <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  {user?.role === 'EMPLOYEE' && user?.managerName && (
                    <span className="text-xs text-gray-500">Manager: {user.managerName}</span>
                  )}
                </div>
                <span className="badge badge-blue">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}