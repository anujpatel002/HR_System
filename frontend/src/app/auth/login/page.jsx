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
    { label: 'Admin', email: 'admin@workzen.com', password: 'admin123' },
    { label: 'HR Officer', email: 'hr@workzen.com', password: 'hr123' },
    { label: 'Payroll Officer', email: 'payroll@workzen.com', password: 'payroll123' },
    { label: 'Employee', email: 'john.doe@workzen.com', password: 'employee123' }
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
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to WorkZen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Smart Human Resource Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700">
                Quick Login (Demo)
              </label>
              <select
                onChange={handleUserSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {defaultUsers.map((user) => (
                  <option key={user.label} value={user.label}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
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
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="input-field"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          

        </form>
      </div>
    </div>
  );
}