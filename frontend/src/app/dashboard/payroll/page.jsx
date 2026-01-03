'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Download, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { payrollAPI, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { canManagePayroll } from '../../../utils/roleGuards';
import { MONTHS } from '../../../utils/constants';
import Pagination from '../../../components/Pagination';

export default function PayrollPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      year: new Date().getFullYear()
    }
  });

  useEffect(() => {
    fetchPayrollData(1);
    if (canManagePayroll(user?.role)) {
      fetchUsers();
    }
  }, []);

  const fetchPayrollData = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      const response = canManagePayroll(user?.role) 
        ? await payrollAPI.getAll(params)
        : await payrollAPI.getByUser(user.id, params);
      
      const data = response.data.data;
      setPayrolls(Array.isArray(data) ? data : data.payrolls || []);
      
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchPayrollData(page);
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data.filter(u => u.basicSalary));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      await payrollAPI.generate(data);
      toast.success('Payroll generated successfully!');
      setShowForm(false);
      reset();
      fetchPayrollData(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
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
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">
            {canManagePayroll(user?.role) ? 'Generate and manage payroll' : 'View your payslips'}
          </p>
        </div>
        
        {canManagePayroll(user?.role) && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Payroll</span>
          </button>
        )}
      </div>

      {/* Bank Details Warning */}
      {!canManagePayroll(user?.role) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Bank Details Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please update your bank details (Account Number and IFSC Code) in your profile to receive payroll payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Generation Form */}
      {showForm && canManagePayroll(user?.role) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Payroll</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  {...register('month', { required: 'Month is required' })}
                  className="input-field"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  {...register('year', { 
                    required: 'Year is required',
                    min: { value: 2020, message: 'Year must be 2020 or later' },
                    max: { value: 2030, message: 'Year must be 2030 or earlier' }
                  })}
                  type="number"
                  className="input-field"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employees (Optional - leave empty to process all)
              </label>
              <select
                {...register('userIds')}
                multiple
                size={Math.min(users.length, 6)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id} className="py-1">
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd and click to select multiple employees. Selected employees will be highlighted.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Generate Payroll
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



      {/* Payroll Records */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {canManagePayroll(user?.role) ? 'All Payroll Records' : 'My Payslips'}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canManagePayroll(user?.role) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll) => (
                <tr key={payroll.id}>
                  {canManagePayroll(user?.role) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.users?.name || 'N/A'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {MONTHS.find(m => m.value === payroll.month)?.label} {payroll.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payroll.basicSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payroll.gross.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payroll.deductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{payroll.netPay.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {payrolls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payroll records found
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

      {/* Payroll Breakdown (for individual payslip view) */}
      {payrolls.length > 0 && !canManagePayroll(user?.role) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Payslip Breakdown</h2>
          {payrolls[0] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Earnings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">₹{payrolls[0].basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Gross Pay</span>
                    <span>₹{payrolls[0].gross.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PF (12%)</span>
                    <span className="font-medium">₹{payrolls[0].pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Professional Tax</span>
                    <span className="font-medium">₹{payrolls[0].tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Deductions</span>
                    <span>₹{payrolls[0].deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-900">Net Pay</span>
                  <span className="text-2xl font-bold text-green-900">
                    ₹{payrolls[0].netPay.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}