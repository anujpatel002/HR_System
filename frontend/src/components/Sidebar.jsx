'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3,
  Settings,
  Activity,
  Monitor,
  Menu
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { canManageUsers, canManagePayroll, canViewAllData } from '../utils/roleGuards';

const getNavigation = (userRole) => {
  if (userRole === 'EMPLOYEE') {
    return [
      { name: 'Dashboard', href: '/dashboard/employee-dashboard', icon: LayoutDashboard },
      { name: 'Attendance', href: '/dashboard/employee-dashboard/attendance', icon: Clock },
      { name: 'Leave', href: '/dashboard/employee-dashboard/leave', icon: Calendar },
      { name: 'Payroll', href: '/dashboard/employee-dashboard/payroll', icon: DollarSign },
      { name: 'Reports', href: '/dashboard/employee-dashboard/reports', icon: BarChart3 },
      { name: 'Profile', href: '/dashboard/employee-dashboard/profile', icon: Settings },
    ];
  }
  
  if (userRole === 'MANAGER') {
    return [
      { name: 'Dashboard', href: '/dashboard/manager-dashboard', icon: LayoutDashboard },
      { name: 'My Team', href: '/dashboard/manager-dashboard/team', icon: Users },
      { name: 'Attendance', href: '/dashboard/manager-dashboard/attendance', icon: Clock },
      { name: 'My Leave', href: '/dashboard/employee-dashboard/leave', icon: Calendar },
      { name: 'Team Leave', href: '/dashboard/leave', icon: Calendar },
      { name: 'My Profile', href: '/dashboard/manager-dashboard/profile', icon: Settings },
    ];
  }
  
  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
    { name: 'Overview', href: '/dashboard/admin-overview', icon: Users, roles: ['admin'] },
    { name: 'Attendance', href: '/dashboard/attendance', icon: Clock, roles: ['all'] },
    { name: 'Leave', href: '/dashboard/leave', icon: Calendar, roles: ['all'] },
    { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign, roles: ['all'] },
    { name: 'Manage Users', href: '/dashboard/admin', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'hr', 'payroll'] },
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const navigation = getNavigation(user?.role);

  const isNavItemVisible = (item) => {
    if (user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') return true;
    if (item.roles?.includes('all')) return true;
    
    if (item.roles?.includes('admin') && user?.role === 'ADMIN') return true;
    if (item.roles?.includes('hr') && user?.role === 'HR_OFFICER') return true;
    if (item.roles?.includes('payroll') && canManagePayroll(user?.role)) return true;
    
    return false;
  };

  const showExpanded = !isCollapsed || isHovered;

  return (
    <>
      {/* Toggle Button - Fixed position for mobile */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-20 left-4 z-50 p-2 bg-white rounded-full shadow-google hover:shadow-google-lg transition-all lg:hidden"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Sidebar */}
      <div 
        className={`bg-white shadow-google border-r border-gray-200 min-h-screen sticky top-0 transition-all duration-300 ${
          showExpanded ? 'w-64' : 'w-20'
        } hidden lg:block`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Toggle button inside sidebar for desktop */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
          {showExpanded && (
            <span className="text-sm font-medium text-gray-700">Menu</span>
          )}
        </div>

        <nav className="mt-2 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              if (!isNavItemVisible(item)) return null;
              
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={!showExpanded ? item.name : ''}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary-600' : 'text-gray-500'
                    } ${showExpanded ? 'mr-3' : 'mx-auto'}`} />
                    {showExpanded && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isCollapsed && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsCollapsed(true)}>
          <div 
            className="w-64 bg-white shadow-google-lg min-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <nav className="mt-2 px-3">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  if (!isNavItemVisible(item)) return null;
                  
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsCollapsed(true)}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-primary-600' : 'text-gray-500'
                        }`} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}