'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function EmployeeLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
    
    // Redirect non-employees to appropriate dashboard
    if (!isLoading && isAuthenticated && user?.role !== 'EMPLOYEE') {
      switch (user?.role) {
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'HR_OFFICER':
          router.push('/dashboard/hr-dashboard');
          break;
        case 'PAYROLL_OFFICER':
          router.push('/dashboard/payroll-dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
    return null;
  }

  return <>{children}</>;
}