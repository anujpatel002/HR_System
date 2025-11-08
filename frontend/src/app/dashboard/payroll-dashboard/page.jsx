'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Calculator, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../../components/StatsCard';
import { payrollAPI, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPayroll: 0,
    processedPayrolls: 0,
    totalEmployees: 0,
    avgSalary: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      const usersRes = await usersAPI.getAll();
      const userData = usersRes.data.data;
      const users = Array.isArray(userData) ? userData : (userData.users || []);
      
      const allPayrollsRes = await payrollAPI.getAll();
      const payrollData = allPayrollsRes.data.data;
      const payrolls = Array.isArray(payrollData) ? payrollData : (payrollData.payrolls || []);

      const totalEmployees = users.filter(u => u.role === 'EMPLOYEE').length;
      const totalNet = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
      const processedPayrolls = payrolls.length;
      const avgSalary = processedPayrolls > 0 ? Math.round(totalNet / processedPayrolls) : 0;

      setStats({
        totalPayroll: totalNet,
        processedPayrolls: processedPayrolls,
        totalEmployees: totalEmployees,
        avgSalary: avgSalary
      });

      setRecentPayrolls(payrolls.slice(0, 5));

      setChartData([
        { name: 'Jan', amount: 450000 },
        { name: 'Feb', amount: 480000 },
        { name: 'Mar', amount: 520000 },
        { name: 'Apr', amount: 510000 },
        { name: 'May', amount: 530000 },
        { name: 'Jun', amount: 550000 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Payroll"
          value={`₹${stats.totalPayroll.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Processed Payrolls"
          value={stats.processedPayrolls}
          icon={Calculator}
          color="blue"
        />
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Average Salary"
          value={`₹${stats.avgSalary.toLocaleString()}`}
          icon={TrendingUp}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payroll Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
            <Bar dataKey="amount" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Payrolls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payrolls</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayrolls.map((payroll) => (
                <tr key={payroll.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.user?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payroll.month}/{payroll.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payroll.gross?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{payroll.netPay?.toLocaleString() || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}