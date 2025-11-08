'use client';

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
  Monitor
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { canManageUsers, canManagePayroll, canViewAllData } from '../utils/roleGuards';

const getNavigation = (userRole) => {
  if (userRole === 'EMPLOYEE') {
    return [
      { name: 'Employees', href: '/dashboard/employee-dashboard', icon: Users },
      { name: 'Attendance', href: '/dashboard/employee-dashboard/attendance', icon: Clock },
      { name: 'Time Off', href: '/dashboard/employee-dashboard/leave', icon: Calendar },
      { name: 'Payroll', href: '/dashboard/employee-dashboard/payroll', icon: DollarSign },
      { name: 'Reports', href: '/dashboard/employee-dashboard/reports', icon: BarChart3 },
      { name: 'Settings', href: '/dashboard/employee-dashboard/profile', icon: Settings },
    ];
  }
  
  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
    { name: 'Overview', href: '/dashboard/admin-overview', icon: Users, roles: ['admin'] },
    { name: 'Attendance', href: '/dashboard/attendance', icon: Clock, roles: ['all'] },
    { name: 'Leave', href: '/dashboard/leave', icon: Calendar, roles: ['all'] },
    { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign, roles: ['all'] },
    { name: 'Manage Users', href: '/dashboard/admin', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Users, roles: ['admin'] },
    { name: 'Activities', href: '/dashboard/activities', icon: Activity, roles: ['admin'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'hr', 'payroll'] },
  ];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const navigation = getNavigation(user?.role);

  const isNavItemVisible = (item) => {
    if (user?.role === 'EMPLOYEE') return true;
    if (item.roles?.includes('all')) return true;
    
    if (item.roles?.includes('admin') && user?.role === 'ADMIN') return true;
    if (item.roles?.includes('hr') && user?.role === 'HR_OFFICER') return true;
    if (item.roles?.includes('payroll') && canManagePayroll(user?.role)) return true;
    
    return false;
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            if (!isNavItemVisible(item)) return null;
            
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}