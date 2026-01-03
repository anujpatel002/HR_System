'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, AlertCircle, X, Download, Filter } from 'lucide-react';
import { leaveAPI } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { exportToCSV, formatLeavesForExport } from '../../../../lib/exportUtils';
import toast from 'react-hot-toast';

export default function EmployeeLeavePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    type: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchLeaves();
    fetchBalance();
  }, [user, statusFilter, startDate, endDate]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const response = await leaveAPI.getByUser(user.id, params);
      const data = response.data.data;
      if (Array.isArray(data)) {
        setLeaves(data);
      } else if (data && Array.isArray(data.leaves)) {
        setLeaves(data.leaves);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await leaveAPI.getBalance(user.id);
      setBalance(response.data.data || []);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await leaveAPI.exportCSV(user.id, params);
      const data = response.data.data;
      const records = Array.isArray(data) ? data : data.leaves || [];
      exportToCSV(formatLeavesForExport(records), 'leaves');
      toast.success('Leaves exported successfully');
    } catch (error) {
      toast.error('Failed to export leaves');
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  const handleCancel = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await leaveAPI.cancel(leaveId);
      toast.success('Leave cancelled successfully');
      fetchLeaves();
      fetchBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await leaveAPI.apply(formData);
      toast.success('Leave application submitted successfully');
      setShowForm(false);
      setFormData({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
      fetchBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave application');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Apply for leave and track your applications</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply for Leave
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Leave Balance Cards */}
      {balance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {balance.map((b) => (
            <div key={b.code} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-600">{b.type}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{b.available}</p>
              <p className="text-xs text-gray-500 mt-1">of {b.total} available</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason for your leave..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Leave History</h2>
        </div>
        
        {leaves.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leave applications found</p>
            <p className="text-sm text-gray-400 mt-1">Click "Apply for Leave" to submit your first application</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {leave.type.replace('_', ' ')} Leave
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                      {leave.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(leave.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{calculateDays(leave.startDate, leave.endDate)} days</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Applied on:</span>
                        <p>{new Date(leave.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Reason:</span>
                        <p className="mt-1">{leave.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {getStatusIcon(leave.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}