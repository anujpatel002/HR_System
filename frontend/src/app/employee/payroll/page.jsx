'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import { payrollAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EmployeePayrollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchPayslips();
  }, [user]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getByUser(user.id);
      setPayslips(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedPayslip(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthYear = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleDownloadPayslip = (payslip) => {
    // Create a simple HTML payslip for download
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${getMonthYear(payslip.payPeriod)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company { font-size: 24px; font-weight: bold; color: #333; }
          .payslip-title { font-size: 18px; margin-top: 10px; }
          .employee-info { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">WorkZen</div>
          <div class="payslip-title">Payslip for ${getMonthYear(payslip.payPeriod)}</div>
        </div>
        
        <div class="employee-info">
          <p><strong>Employee Name:</strong> ${user.name}</p>
          <p><strong>Employee ID:</strong> ${user.id}</p>
          <p><strong>Department:</strong> ${user.department || 'N/A'}</p>
          <p><strong>Pay Period:</strong> ${getMonthYear(payslip.payPeriod)}</p>
        </div>
        
        <table class="table">
          <tr><th>Description</th><th>Amount</th></tr>
          <tr><td>Basic Salary</td><td>${formatCurrency(payslip.basicSalary)}</td></tr>
          <tr><td>Gross Salary</td><td>${formatCurrency(payslip.grossSalary)}</td></tr>
          <tr><td>Provident Fund (12%)</td><td>-${formatCurrency(payslip.providentFund)}</td></tr>
          <tr><td>Professional Tax</td><td>-${formatCurrency(payslip.professionalTax)}</td></tr>
          <tr><td>Other Deductions</td><td>-${formatCurrency(payslip.deductions)}</td></tr>
          <tr class="total-row"><td><strong>Net Salary</strong></td><td><strong>${formatCurrency(payslip.netSalary)}</strong></td></tr>
        </table>
        
        <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
      </body>
      </html>
    `;

    const blob = new Blob([payslipHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${getMonthYear(payslip.payPeriod).replace(' ', '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Payslip downloaded successfully');
  };

  if (loading) {
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
                <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
                <p className="text-sm text-gray-500">View and download your payslips</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payslip List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Payslip History</h2>
              </div>
              
              {payslips.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payslips found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {payslips.map((payslip) => (
                    <div
                      key={payslip.id}
                      onClick={() => setSelectedPayslip(payslip)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPayslip?.id === payslip.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {getMonthYear(payslip.payPeriod)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Net: {formatCurrency(payslip.netSalary)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payslip Details */}
          <div className="lg:col-span-2">
            {selectedPayslip ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Payslip - {getMonthYear(selectedPayslip.payPeriod)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Generated on {formatDate(selectedPayslip.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadPayslip(selectedPayslip)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="p-6">
                  {/* Employee Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Employee Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employee ID</p>
                        <p className="font-medium">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{user.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pay Period</p>
                        <p className="font-medium">{getMonthYear(selectedPayslip.payPeriod)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Basic Salary
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(selectedPayslip.basicSalary)}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Gross Salary
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(selectedPayslip.grossSalary)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Deductions</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Provident Fund (12%)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right text-red-600">
                              -{formatCurrency(selectedPayslip.providentFund)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Professional Tax
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right text-red-600">
                              -{formatCurrency(selectedPayslip.professionalTax)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Other Deductions
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right text-red-600">
                              -{formatCurrency(selectedPayslip.deductions)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">Net Salary</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(selectedPayslip.netSalary)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a payslip to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}