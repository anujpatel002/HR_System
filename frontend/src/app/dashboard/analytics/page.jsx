'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import StatsCard from '../../../components/StatsCard';
import { useAuth } from '../../../hooks/useAuth';
import { canViewAllData } from '../../../utils/roleGuards';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Sample data - in real app, fetch from API
  const [analyticsData, setAnalyticsData] = useState({
    monthlyPayroll: [
      { month: 'Jan', amount: 450000, employees: 45 },
      { month: 'Feb', amount: 480000, employees: 48 },
      { month: 'Mar', amount: 520000, employees: 52 },
      { month: 'Apr', amount: 510000, employees: 51 },
      { month: 'May', amount: 530000, employees: 53 },
      { month: 'Jun', amount: 550000, employees: 55 },
    ],
    departmentDistribution: [
      { name: 'Engineering', value: 40, color: '#3b82f6' },
      { name: 'Marketing', value: 25, color: '#10b981' },
      { name: 'Sales', value: 20, color: '#f59e0b' },
      { name: 'HR', value: 10, color: '#ef4444' },
      { name: 'Finance', value: 5, color: '#8b5cf6' },
    ],
    attendanceTrend: [
      { date: 'Week 1', present: 85, absent: 15 },
      { date: 'Week 2', present: 88, absent: 12 },
      { date: 'Week 3', present: 82, absent: 18 },
      { date: 'Week 4', present: 90, absent: 10 },
    ],
    leaveStats: [
      { type: 'Sick', count: 12 },
      { type: 'Casual', count: 18 },
      { type: 'Annual', count: 25 },
      { type: 'Maternity', count: 3 },
    ]
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (!canViewAllData(user?.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view analytics.</p>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive HR analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employees"
          value="55"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Avg Attendance"
          value="86%"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Pending Leaves"
          value="8"
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Monthly Payroll"
          value="₹5.5L"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payroll Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.monthlyPayroll}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'amount' ? `₹${value.toLocaleString()}` : value,
                  name === 'amount' ? 'Payroll' : 'Employees'
                ]}
              />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.departmentDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.departmentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}%`, name === 'present' ? 'Present' : 'Absent']} />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.leaveStats} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Payroll
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.monthlyPayroll.map((month, index) => {
                const prevMonth = analyticsData.monthlyPayroll[index - 1];
                const growth = prevMonth 
                  ? ((month.amount - prevMonth.amount) / prevMonth.amount * 100).toFixed(1)
                  : 0;
                
                return (
                  <tr key={month.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month} 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.employees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{month.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{Math.round(month.amount / month.employees).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        growth > 0 
                          ? 'bg-green-100 text-green-800'
                          : growth < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {growth > 0 ? '+' : ''}{growth}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}