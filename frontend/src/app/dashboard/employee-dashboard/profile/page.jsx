'use client';

import { useState, useEffect } from 'react';
import { User, Edit, Save, X } from 'lucide-react';
import { usersAPI } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EmployeeProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      department: user.department || '',
      designation: user.designation || '',
      phone: user.phone || '',
      address: user.address || ''
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.update(user.id, formData);
      
      setUser(response.data.data);
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      department: user.department || '',
      designation: user.designation || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">View and edit your personal information</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-lg text-gray-600">{user.designation}</p>
              <p className="text-sm text-gray-500">{user.department}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              ) : (
                <p className="text-gray-900 py-2">{user.email}</p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.department || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.designation || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <p className="text-gray-900 py-2">{user.id}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="px-6 py-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Employment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <p className="text-gray-900 py-2">{user.role.replace('_', ' ')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic Salary
              </label>
              <p className="text-gray-900 py-2">
                {user.basicSalary ? `₹${user.basicSalary.toLocaleString()}` : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Date
              </label>
              <p className="text-gray-900 py-2">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}