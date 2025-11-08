'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, UserCheck } from 'lucide-react';
import StatsCard from '../../../components/StatsCard';
import { usersAPI, leaveAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    presentToday: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, leavesRes] = await Promise.all([
        usersAPI.getAll(),
        leaveAPI.getAll()
      ]);

      // Handle response structure properly
      const userData = usersRes.data.data;
      const usersList = Array.isArray(userData) ? userData : (userData.users || []);
      
      const leaveData = leavesRes.data.data;
      const leaves = Array.isArray(leaveData) ? leaveData : (leaveData.leaves || []);
      
      setStats({
        totalEmployees: usersList.filter(u => u.role === 'EMPLOYEE').length,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length,
        approvedLeaves: leaves.filter(l => l.status === 'APPROVED').length,
        presentToday: 0
      });

      setRecentLeaves(leaves.slice(0, 5));
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
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
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
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Approved Leaves"
          value={stats.approvedLeaves}
          icon={UserCheck}
          color="green"
        />
        <StatsCard
          title="Present Today"
          value={stats.presentToday}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Recent Leave Requests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.user?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}