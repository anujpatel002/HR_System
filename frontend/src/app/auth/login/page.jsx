'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loginUser, clearError } from '../../../store/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const defaultUsers = [
    { label: 'Select Demo Account', email: '', password: '' },
    { label: 'Admin - DayFlow', email: 'admin@dayflow.com', password: 'admin123' },
    { label: 'HR Officer - DayFlow', email: 'hr@dayflow.com', password: 'hr123' },
    { label: 'Payroll Officer - DayFlow', email: 'payroll@dayflow.com', password: 'payroll123' },
    { label: 'Manager - Engineering', email: 'manager.eng@dayflow.com', password: 'manager123' },
    { label: 'Manager - Sales', email: 'manager.sales@dayflow.com', password: 'manager123' },
    { label: 'Manager - Marketing', email: 'manager.marketing@dayflow.com', password: 'manager123' },
    { label: 'Admin - InnovateCorp', email: 'admin@innovatecorp.com', password: 'admin123' },
    { label: 'HR - InnovateCorp', email: 'hr@innovatecorp.com', password: 'hr123' },
    { label: 'Payroll - InnovateCorp', email: 'payroll@innovatecorp.com', password: 'payroll123' },
    { label: 'Manager - Operations', email: 'manager.ops@innovatecorp.com', password: 'manager123' },
    { label: 'Admin - TechStart', email: 'admin@techstart.com', password: 'admin123' },
    { label: 'HR - TechStart', email: 'hr@techstart.com', password: 'hr123' },
    { label: 'Payroll - TechStart', email: 'payroll@techstart.com', password: 'payroll123' },
    { label: 'Manager - Development', email: 'manager.dev@techstart.com', password: 'manager123' },
    { label: 'Employee - John Smith', email: 'john.smith@dayflowtech.com', password: 'employee123' },
    { label: 'Employee - Jane Doe', email: 'jane.doe@dayflowtech.com', password: 'employee123' },
    { label: 'Employee - Mike Johnson', email: 'mike.johnson@innovatecorp.com', password: 'employee123' },
    { label: 'Employee - Sarah Wilson', email: 'sarah.wilson@techstart.com', password: 'employee123' }
  ];

  const handleUserSelect = (e) => {
    const selectedUser = defaultUsers.find(user => user.label === e.target.value);
    if (selectedUser && selectedUser.email) {
      setValue('email', selectedUser.email);
      setValue('password', selectedUser.password);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (result.type === 'auth/login/fulfilled') {
      toast.success('Login successful!');
      
      // Bank details check temporarily disabled until schema is updated
      
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Google-style logo */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-4">
            <span className="text-4xl font-normal text-primary-600">{process.env.NEXT_PUBLIC_APP_NAME?.split('')[0] || 'Day'}</span>
            <span className="text-4xl font-normal text-accent-red">{process.env.NEXT_PUBLIC_APP_NAME?.slice(3) || 'Flow'}</span>
          </div>
          <h2 className="text-2xl font-normal text-gray-900">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            to continue to {process.env.NEXT_PUBLIC_APP_NAME || 'DayFlow'} HR System
          </p>
        </div>
        
        <div className="card">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Login (Demo)
                </label>
                <select
                  onChange={handleUserSelect}
                  className="input-field"
                >
                  {defaultUsers.map((user) => (
                    <option key={user.label} value={user.label}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="input-field"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-accent-red">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  className="input-field"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-accent-red">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a href="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            <div className="flex items-center justify-between pt-4">
              <a href="/auth/signup" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Create account
              </a>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Smart Human Resource Management System'}
          </p>
        </div>
      </div>
    </div>
  );
}