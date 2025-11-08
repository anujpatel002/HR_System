'use client';

import { useState } from 'react';
import { Menu, X, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function MobileLayout({ children, title = "WorkZen" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h2 className="text-xl font-bold text-gray-900">WorkZen</h2>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {/* Navigation items will be passed as children or props */}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto p-2 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-col lg:min-h-screen">
        {children}
      </div>

      {/* Mobile content */}
      <div className="lg:hidden">
        {children}
      </div>
    </div>
  );
}