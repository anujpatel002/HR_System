'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';

import { getErrorMessage } from '../../../utils/errorUtils';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const sendOTP = async (emailAddr) => {
    try {
      await authAPI.sendOTP(emailAddr);
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (error) {
      toast.error('Failed to send OTP');
    }
  };

  const onSubmit = async (data) => {
    setFormData(data);
    setLoading(true);
    await sendOTP(data.email);
    setLoading(false);
  };

  const verifyAndRegister = async (otp) => {
    try {
      setLoading(true);
      await authAPI.verifyOTP(formData.email, otp);
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'ADMIN',
        company: formData.companyName,
        department: 'Management',
        designation: 'Administrator'
      });
      toast.success('Account created! Please login.');
      router.push('/auth/login');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('already exists') || errorMessage.includes('User already exists')) {
        toast.error('This email is already registered. Please use a different email or login instead.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Google-style logo */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-4">
            <span className="text-4xl font-normal text-primary-600">{process.env.NEXT_PUBLIC_APP_NAME?.split('')[0] || 'Day'}</span>
            <span className="text-4xl font-normal text-accent-red">{process.env.NEXT_PUBLIC_APP_NAME?.slice(3) || 'Flow'}</span>
          </div>
          <h2 className="text-2xl font-normal text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Setup your {process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'HR Management System'}
          </p>
        </div>
        
        <div className="card">
          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input {...register('companyName', { required: 'Required' })} type="text" className="input-field" />
                {errors.companyName && <p className="mt-2 text-sm text-accent-red">{errors.companyName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input {...register('name', { required: 'Required' })} type="text" className="input-field" />
                {errors.name && <p className="mt-2 text-sm text-accent-red">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input {...register('email', { required: 'Required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })} type="email" className="input-field" />
                {errors.email && <p className="mt-2 text-sm text-accent-red">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} type="password" className="input-field" />
                {errors.password && <p className="mt-2 text-sm text-accent-red">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input {...register('confirmPassword', { required: 'Required', validate: v => v === password || 'No match' })} type="password" className="input-field" />
                {errors.confirmPassword && <p className="mt-2 text-sm text-accent-red">{errors.confirmPassword.message}</p>}
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send Verification Code'}
                </button>
              </div>
              <div className="text-center pt-2">
                <Link href="/auth/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">Already have an account? Sign in</Link>
              </div>
            </form>
          ) : (
            <OTPVerification email={formData?.email} onVerify={verifyAndRegister} loading={loading} onBack={() => setStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

function OTPVerification({ email, onVerify, loading, onBack }) {
  const [otp, setOtp] = useState('');
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Verify your email</h3>
        <p className="text-sm text-gray-600">Enter the 6-digit code sent to</p>
        <p className="text-sm font-medium text-gray-900">{email}</p>
      </div>
      <input
        type="text"
        maxLength="6"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        className="input-field text-center text-2xl tracking-widest font-semibold"
        placeholder="000000"
      />
      <button
        onClick={() => onVerify(otp)}
        disabled={loading || otp.length !== 6}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify & Create Account'}
      </button>
      <button onClick={onBack} className="w-full btn-secondary">
        Back
      </button>
    </div>
  );
}
