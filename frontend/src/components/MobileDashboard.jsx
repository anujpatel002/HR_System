'use client';

import { useState, useEffect } from 'react';
import { 
  Home, Users, Clock, Calendar, DollarSign, 
  BarChart3, Settings, Menu, X, Bell, User,
  CheckCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function MobileDashboard({ children, currentPage = 'dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    thisMonthPayroll: 0
  });
  
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/dashboard/admin' },
    { id: 'attendance', label: 'Attendance', icon: Clock, path: '/dashboard/attendance' },
    { id: 'leave', label: 'Leave', icon: Calendar, path: '/dashboard/leave' },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, path: '/dashboard/payroll' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { id: 'activities', label: 'Activities', icon: Activity, path: '/dashboard/activities' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' }
  ];

  const handleNavigation = (path) => {
    router.push(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900">WorkZen</h1>
        
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white slide-in-mobile">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Sidebar Header */}
            <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">WorkZen</h2>
              <p className="text-sm text-gray-500">HR Management</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            
            {/* User Profile */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h2 className="text-xl font-bold text-gray-900">WorkZen</h2>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-600" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 rounded-md"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 mobile-safe-area">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center py-2 px-1 rounded-md transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}