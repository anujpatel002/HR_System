'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usersAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import { canManageUsers } from '../../../utils/roleGuards';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (!canManageUsers(user?.role)) {
      toast.error('Access denied');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, data);
        toast.success('User updated successfully!');
      } else {
        toast.info('User registration should be done through the registration page');
        return;
      }
      
      setShowForm(false);
      setEditingUser(null);
      reset();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('department', user.department || '');
    setValue('designation', user.designation || '');
    setValue('basicSalary', user.basicSalary || '');
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!canManageUsers(user?.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        
        <button
          onClick={() => {
            setEditingUser(null);
            reset();
            setShowForm(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="input-field"
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  placeholder="Enter email address"
                  disabled={editingUser}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="input-field"
                >
                  <option value="">Select role</option>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  {...register('department')}
                  type="text"
                  className="input-field"
                  placeholder="Enter department"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  {...register('designation')}
                  type="text"
                  className="input-field"
                  placeholder="Enter designation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Basic Salary
                </label>
                <input
                  {...register('basicSalary', {
                    min: { value: 0, message: 'Salary must be positive' }
                  })}
                  type="number"
                  className="input-field"
                  placeholder="Enter basic salary"
                />
                {errors.basicSalary && (
                  <p className="mt-1 text-sm text-red-600">{errors.basicSalary.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingUser ? 'Update User' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  reset();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'HR_OFFICER'
                        ? 'bg-blue-100 text-blue-800'
                        : user.role === 'PAYROLL_OFFICER'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.designation || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.basicSalary ? `₹${user.basicSalary.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}