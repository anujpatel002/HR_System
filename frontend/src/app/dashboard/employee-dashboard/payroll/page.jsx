'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Download, FileText } from 'lucide-react';
import { payrollAPI } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
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
      const data = response.data.data;
      const payslipsArray = Array.isArray(data) ? data : data.payrolls || [];
      setPayslips(payslipsArray);
      if (payslipsArray.length > 0) {
        setSelectedPayslip(payslipsArray[0]);
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

  const getMonthYear = (month, year) => {
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleDownloadPayslip = (payslip) => {
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
          <p><strong>Pay Period:</strong> ${getMonthYear(payslip.month, payslip.year)}</p>
        </div>
        
        <table class="table">
          <tr><th>Description</th><th>Amount</th></tr>
          <tr><td>Basic Salary</td><td>${formatCurrency(payslip.basicSalary)}</td></tr>
          <tr><td>Gross Salary</td><td>${formatCurrency(payslip.gross)}</td></tr>
          <tr><td>Provident Fund (12%)</td><td>-${formatCurrency(payslip.pf)}</td></tr>
          <tr><td>Professional Tax</td><td>-${formatCurrency(payslip.tax)}</td></tr>
          <tr><td>Other Deductions</td><td>-${formatCurrency(0)}</td></tr>
          <tr class="total-row"><td><strong>Total Deductions</strong></td><td><strong>-${formatCurrency(payslip.deductions)}</strong></td></tr>
          <tr class="total-row"><td><strong>Net Salary</strong></td><td><strong>${formatCurrency(payslip.netPay)}</strong></td></tr>
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">View and download your payslips</p>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Payslips</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthYear(payslip.month, payslip.year)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payslip.basicSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payslip.gross)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payslip.deductions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payslip.netPay)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleDownloadPayslip(payslip)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {payslips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No payslips found</p>
            </div>
          )}
        </div>
      </div>

      {/* Latest Payslip Breakdown */}
      {payslips.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Latest Payslip Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Earnings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(payslips[0].basicSalary)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Gross Pay</span>
                    <span>{formatCurrency(payslips[0].gross)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PF (12%)</span>
                    <span className="font-medium">{formatCurrency(payslips[0].pf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Professional Tax</span>
                    <span className="font-medium">{formatCurrency(payslips[0].tax)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Deductions</span>
                    <span>{formatCurrency(payslips[0].deductions)}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-900">Net Pay</span>
                  <span className="text-2xl font-bold text-green-900">
                    {formatCurrency(payslips[0].netPay)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}