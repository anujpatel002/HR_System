'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { leaveAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { LEAVE_TYPES, LEAVE_STATUS } from '../../../utils/constants';
import { canManageLeaves } from '../../../utils/roleGuards';
import { format } from 'date-fns';
import Pagination from '../../../components/Pagination';

export default function LeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchLeaves(1);
  }, []);

  const fetchLeaves = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      const response = canManageLeaves(user?.role) 
        ? await leaveAPI.getAll(params)
        : await leaveAPI.getByUser(user.id, params);
      
      const data = response.data.data;
      setLeaves(Array.isArray(data) ? data : data.leaves || []);
      
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchLeaves(page);
  };

  const onSubmit = async (data) => {
    try {
      await leaveAPI.apply(data);
      toast.success('Leave application submitted successfully!');
      setShowForm(false);
      reset();
      fetchLeaves(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      await leaveAPI.updateStatus(leaveId, status);
      toast.success(`Leave ${status.toLowerCase()} successfully!`);
      fetchLeaves(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update leave status');
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Apply for and manage leave requests</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Application Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Apply for Leave</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type
                </label>
                <select
                  {...register('type', { required: 'Leave type is required' })}
                  className="input-field"
                >
                  <option value="">Select leave type</option>
                  {Object.entries(LEAVE_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  {...register('endDate', { required: 'End date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                {...register('reason', { 
                  required: 'Reason is required',
                  minLength: { value: 10, message: 'Reason must be at least 10 characters' }
                })}
                rows={3}
                className="input-field"
                placeholder="Please provide a reason for your leave..."
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Submit Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
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

      {/* Leave History */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {canManageLeaves(user?.role) ? 'All Leave Requests' : 'My Leave History'}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canManageLeaves(user?.role) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageLeaves(user?.role) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  {canManageLeaves(user?.role) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.users?.name || 'N/A'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      leave.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800'
                        : leave.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {canManageLeaves(user?.role) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaves.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No leave requests found
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