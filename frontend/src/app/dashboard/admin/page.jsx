'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usersAPI } from '../../../lib/api';
import { userRequestAPI } from '../../../lib/userRequestAPI';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES, DEPARTMENTS } from '../../../utils/constants';
import { canManageUsers, isAdmin, isHR } from '../../../utils/roleGuards';
import Pagination from '../../../components/Pagination';

import { getErrorMessage } from '../../../utils/errorUtils';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  // Watch for department and role changes
  const watchDepartment = watch('department');
  const watchRole = watch('role');

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    
    if (!canManageUsers(currentUser.role)) {
      toast.error('Access denied');
      return;
    }
    
    // Fetch data only once when component mounts
    fetchUsers(1);
    if (isAdmin(currentUser.role)) {
      fetchPendingRequests();
    }
  }, [currentUser?.id]); // Only re-run if user ID changes

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({ page, limit: 10 });
      
      // Consistent response structure: response.data.data contains the payload
      const { users, pagination } = response.data.data;
      setUsers(users || []);
      
      if (pagination) {
        setTotalPages(pagination.pages);
        setTotalUsers(pagination.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on external state

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await userRequestAPI.getPending();
      setPendingRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }, []);

  // Auto-assign manager when department and role change
  useEffect(() => {
    const autoAssignManager = async () => {
      // Only auto-assign for employees when creating (not editing)
      if (!editingUser && watchDepartment && watchRole === ROLES.EMPLOYEE) {
        try {
          // Fetch all users to find the department manager
          const response = await usersAPI.getAll({ limit: 1000 });
          const userData = response.data.data;
          const usersList = Array.isArray(userData) ? userData : (userData.users || []);
          
          // Find manager in the selected department
          const manager = usersList.find(u => 
            u.department === watchDepartment && 
            u.role === ROLES.MANAGER
          );
          
          if (manager) {
            setValue('managerId', manager.id);
            toast.success(`Auto-assigned manager: ${manager.name}`);
          } else {
            setValue('managerId', '');
            toast.info(`No manager found for ${watchDepartment} department`);
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
        }
      }
    };

    autoAssignManager();
  }, [watchDepartment, watchRole, editingUser, setValue]);

  const onSubmit = async (data) => {
    try {
      if (isAdmin(currentUser.role)) {
        // Admin can directly perform operations
        if (editingUser) {
          await usersAPI.update(editingUser.id, data);
          toast.success('User updated successfully!');
        } else {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error('Failed to create user');
          toast.success('User created successfully!');
        }
        fetchUsers(currentPage);
      } else {
        // HR needs to submit request for approval
        const requestType = editingUser ? 'UPDATE_USER' : 'CREATE_USER';
        await userRequestAPI.create({
          type: requestType,
          targetUserId: editingUser?.id,
          data
        });
        toast.success('Request submitted for admin approval!');
      }
      
      setShowForm(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
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
    setValue('accountNumber', user.accountNumber || '');
    setValue('ifscCode', user.ifscCode || '');
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      if (isAdmin(currentUser.role)) {
        await usersAPI.delete(userId);
        toast.success('User deleted successfully!');
        fetchUsers(currentPage);
      } else {
        await userRequestAPI.create({
          type: 'DELETE_USER',
          targetUserId: userId,
          data: {}
        });
        toast.success('Delete request submitted for admin approval!');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await userRequestAPI.approve(requestId, '');
      toast.success('Request approved!');
      fetchPendingRequests();
      fetchUsers(currentPage);
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await userRequestAPI.reject(requestId, '');
      toast.success('Request rejected!');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we verify your authentication.</p>
      </div>
    );
  }
  
  if (!canManageUsers(currentUser.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        <div className="mt-4 text-sm text-gray-500">
          Current role: {currentUser.role}
        </div>
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
        
        <div className="flex space-x-3">
          {canManageUsers(currentUser?.role) && (
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
          )}
          {isAdmin(currentUser?.role) && pendingRequests.length > 0 && (
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Pending Requests ({pendingRequests.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* User Form */}
      {showForm && canManageUsers(currentUser?.role) && (
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
                  {Object.entries(ROLES).map(([key, value]) => {
                    // HR can only create EMPLOYEE users
                    if (isHR(currentUser?.role) && value !== 'EMPLOYEE') {
                      return null;
                    }
                    return (
                      <option key={key} value={value}>
                        {value.replace('_', ' ')}
                      </option>
                    );
                  })}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  {...register('department', {
                    required: !editingUser ? 'Department is required' : false
                  })}
                  className="input-field"
                >
                  <option value="">Select Department</option>
                  {Object.entries(DEPARTMENTS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  {...register('designation', {
                    required: !editingUser ? 'Designation is required' : false
                  })}
                  type="text"
                  className="input-field"
                  placeholder="Enter designation"
                />
                {errors.designation && (
                  <p className="mt-1 text-sm text-red-600">{errors.designation.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Basic Salary
                </label>
                <input
                  {...register('basicSalary', {
                    required: !editingUser ? 'Basic salary is required' : false,
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
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    type="password"
                    className="input-field"
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              )}
              
              {/* Hidden field for managerId - auto-populated for employees */}
              <input
                {...register('managerId')}
                type="hidden"
              />
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

      {/* Pending Requests */}
      {showRequests && isAdmin(currentUser?.role) && pendingRequests.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending HR Requests</h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Requested by: {request.requester.name}</p>
                    <p className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="px-4 py-2 bg-accent-green text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-4 py-2 bg-accent-red text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Users ({totalUsers})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
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
                  Bank Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((tableUser) => (
                <tr key={tableUser.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {tableUser.employeeId || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tableUser.name}</div>
                      <div className="text-sm text-gray-500">{tableUser.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      tableUser.role === 'ADMIN' 
                        ? 'badge-red'
                        : tableUser.role === 'HR_OFFICER'
                        ? 'badge-blue'
                        : tableUser.role === 'PAYROLL_OFFICER'
                        ? 'bg-purple-50 text-purple-700'
                        : 'badge-green'
                    }`}>
                      {tableUser.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tableUser.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tableUser.designation || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tableUser.basicSalary ? `₹${tableUser.basicSalary.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tableUser.accountNumber && tableUser.ifscCode ? (
                      <span className="badge badge-green">✓ Complete</span>
                    ) : (
                      <span className="badge badge-red">✗ Missing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Admin: Direct edit/delete */}
                      {isAdmin(currentUser?.role) && (
                        <>
                          <button
                            onClick={() => handleEdit(tableUser)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tableUser.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {/* HR: Request approval for edit/delete EMPLOYEES only */}
                      {isHR(currentUser?.role) && tableUser.role === 'EMPLOYEE' && (
                        <>
                          <button
                            onClick={() => handleEdit(tableUser)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Request Edit (Needs Approval)"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tableUser.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Request Delete (Needs Approval)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {/* HR cannot manage non-employees */}
                      {isHR(currentUser?.role) && tableUser.role !== 'EMPLOYEE' && (
                        <span className="text-gray-400 text-xs">No Access</span>
                      )}
                      {/* Show view-only for other roles */}
                      {currentUser && !canManageUsers(currentUser.role) && (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
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
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}