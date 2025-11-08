'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../../components/StatsCard';
import { payrollAPI, usersAPI, leaveAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

export default function AdminDashboard() {
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
      
      const [usersRes, payrollRes, leavesRes] = await Promise.all([
        usersAPI.getAll(),
        payrollAPI.getStats(),
        leaveAPI.getAll({ status: 'PENDING' })
      ]);

      setStats({
        totalEmployees: usersRes.data.data.filter(u => u.role === 'EMPLOYEE').length,
        presentToday: 0,
        pendingLeaves: leavesRes.data.data.length,
        totalPayroll: payrollRes.data.data.totalNet || 0
      });

      setChartData([
        { name: 'Jan', payroll: 450000 },
        { name: 'Feb', payroll: 480000 },
        { name: 'Mar', payroll: 520000 },
        { name: 'Apr', payroll: 510000 },
        { name: 'May', payroll: 530000 },
        { name: 'Jun', payroll: 550000 },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>

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
    </div>
  );
}