'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role to specific dashboards
      switch (user.role) {
        case 'EMPLOYEE':
          router.push('/dashboard/employee-dashboard');
          break;
        case 'ADMIN':
          router.push('/dashboard/admin-dashboard');
          break;
        case 'HR_OFFICER':
          router.push('/dashboard/hr-dashboard');
          break;
        case 'PAYROLL_OFFICER':
          router.push('/dashboard/payroll-dashboard');
          break;
        default:
          router.push('/dashboard/employee-dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">WorkZen</h1>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}