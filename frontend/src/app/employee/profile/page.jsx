'use client';

import { useState, useEffect } from 'react';
import { User, ArrowLeft, Edit, Save, X } from 'lucide-react';
import { usersAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
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
      
      // Update user in auth context
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/employee')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500">View and edit your personal information</p>
              </div>
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
            )}\n          </div>\n        </div>\n      </div>\n\n      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">\n        <div className="bg-white rounded-lg shadow">\n          {/* Profile Header */}\n          <div className="px-6 py-8 border-b border-gray-200">\n            <div className="flex items-center space-x-6">\n              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">\n                <User className="w-12 h-12 text-blue-600" />\n              </div>\n              <div>\n                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>\n                <p className="text-lg text-gray-600">{user.designation}</p>\n                <p className="text-sm text-gray-500">{user.department}</p>\n                <div className="mt-2">\n                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">\n                    {user.role.replace('_', ' ')}\n                  </span>\n                </div>\n              </div>\n            </div>\n          </div>\n\n          {/* Profile Information */}\n          <div className="px-6 py-6">\n            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>\n            \n            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Full Name\n                </label>\n                {isEditing ? (\n                  <input\n                    type="text"\n                    name="name"\n                    value={formData.name}\n                    onChange={handleInputChange}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.name}</p>\n                )}\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Email Address\n                </label>\n                {isEditing ? (\n                  <input\n                    type="email"\n                    name="email"\n                    value={formData.email}\n                    onChange={handleInputChange}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                    disabled\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.email}</p>\n                )}\n                {isEditing && (\n                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>\n                )}\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Department\n                </label>\n                {isEditing ? (\n                  <input\n                    type="text"\n                    name="department"\n                    value={formData.department}\n                    onChange={handleInputChange}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.department || 'N/A'}</p>\n                )}\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Designation\n                </label>\n                {isEditing ? (\n                  <input\n                    type="text"\n                    name="designation"\n                    value={formData.designation}\n                    onChange={handleInputChange}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.designation || 'N/A'}</p>\n                )}\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Phone Number\n                </label>\n                {isEditing ? (\n                  <input\n                    type="tel"\n                    name="phone"\n                    value={formData.phone}\n                    onChange={handleInputChange}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                    placeholder="Enter phone number"\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.phone || 'Not provided'}</p>\n                )}\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Employee ID\n                </label>\n                <p className="text-gray-900 py-2">{user.id}</p>\n              </div>\n\n              <div className="md:col-span-2">\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Address\n                </label>\n                {isEditing ? (\n                  <textarea\n                    name="address"\n                    value={formData.address}\n                    onChange={handleInputChange}\n                    rows={3}\n                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"\n                    placeholder="Enter your address"\n                  />\n                ) : (\n                  <p className="text-gray-900 py-2">{user.address || 'Not provided'}</p>\n                )}\n              </div>\n            </div>\n          </div>\n\n          {/* Employment Information */}\n          <div className="px-6 py-6 border-t border-gray-200">\n            <h3 className="text-lg font-medium text-gray-900 mb-6">Employment Information</h3>\n            \n            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Role\n                </label>\n                <p className="text-gray-900 py-2">{user.role.replace('_', ' ')}</p>\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Basic Salary\n                </label>\n                <p className="text-gray-900 py-2">\n                  {user.basicSalary ? `₹${user.basicSalary.toLocaleString()}` : 'N/A'}\n                </p>\n              </div>\n\n              <div>\n                <label className="block text-sm font-medium text-gray-700 mb-2">\n                  Join Date\n                </label>\n                <p className="text-gray-900 py-2">\n                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}\n                </p>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}