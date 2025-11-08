'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, Monitor } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { isAdmin } from '../../../utils/roleGuards';
import { usersAPI } from '../../../lib/api';
import api from '../../../lib/api';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, sessionsRes] = await Promise.all([
        usersAPI.getAll(),
        api.get('/sessions/active')
      ]);
      
      setUsers(usersRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can view this page.</p>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">All Users Overview</h1>
        <div className="text-sm text-gray-500">
          Total: {users.length} | Online: {sessions.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  {sessions.find(s => s.userId === user.id) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-red-100 text-red-800'
                      : user.role === 'HR_OFFICER'
                      ? 'bg-blue-100 text-blue-800'
                      : user.role === 'PAYROLL_OFFICER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                {user.department && (
                  <p className="text-xs text-gray-500 mt-1">{user.department}</p>
                )}
                {user.employeeId && (
                  <p className="text-xs text-gray-400 mt-1">ID: {user.employeeId}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/dashboard/admin" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="ml-3 font-medium text-gray-900">Manage Users</span>
          </div>
        </Link>
        
        <Link href="/dashboard/sessions" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Monitor className="h-6 w-6 text-green-600" />
            <span className="ml-3 font-medium text-gray-900">Active Sessions</span>
          </div>
        </Link>
        
        <Link href="/dashboard/activities" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-purple-600" />
            <span className="ml-3 font-medium text-gray-900">Activity Logs</span>
          </div>
        </Link>
      </div>
    </div>
  );
}