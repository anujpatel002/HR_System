'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../../components/StatsCard';
import { payrollAPI, usersAPI, attendanceAPI, leaveAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { canViewAllData } from '../../utils/roleGuards';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (canViewAllData(user?.role)) {
        // Fetch stats for admin/hr/payroll users
        const [usersRes, payrollRes, leavesRes] = await Promise.all([
          usersAPI.getAll(),
          payrollAPI.getStats(),
          leaveAPI.getAll({ status: 'PENDING' })
        ]);

        setStats({
          totalEmployees: usersRes.data.data.filter(u => u.role === 'EMPLOYEE').length,
          presentToday: 0, // Would need today's attendance data
          pendingLeaves: leavesRes.data.data.length,
          totalPayroll: payrollRes.data.data.totalNet || 0
        });

        // Sample chart data
        setChartData([
          { name: 'Jan', payroll: 450000 },
          { name: 'Feb', payroll: 480000 },
          { name: 'Mar', payroll: 520000 },
          { name: 'Apr', payroll: 510000 },
          { name: 'May', payroll: 530000 },
          { name: 'Jun', payroll: 550000 },
        ]);
      } else {
        // Employee view - show personal stats
        setStats({
          totalEmployees: 0,
          presentToday: 0,
          pendingLeaves: 0,
          totalPayroll: 0
        });
      }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>

      {canViewAllData(user?.role) ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Present Today"
              value={stats.presentToday}
              icon={Clock}
              color="green"
            />
            <StatsCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              icon={Calendar}
              color="yellow"
            />
            <StatsCard
              title="Total Payroll"
              value={`₹${stats.totalPayroll.toLocaleString()}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payroll Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Payroll']} />
                  <Bar dataKey="payroll" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Engineering', value: 40 },
                      { name: 'Marketing', value: 25 },
                      { name: 'Sales', value: 20 },
                      { name: 'HR', value: 15 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to WorkZen</h2>
          <p className="text-gray-600 mb-6">Use the navigation menu to access your HR tools</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-blue-900">Attendance</h3>
              <p className="text-sm text-blue-700">Mark your daily attendance</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-green-900">Leave</h3>
              <p className="text-sm text-green-700">Apply for leave requests</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-purple-900">Payroll</h3>
              <p className="text-sm text-purple-700">View your payslips</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}