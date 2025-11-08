'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Power } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { isAdmin } from '../../../utils/roleGuards';
import Pagination from '../../../components/Pagination';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [userActivities, setUserActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showActivities, setShowActivities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
    fetchSessions(1);
  }, [user]);

  const handlePageChange = (page) => {
    fetchSessions(page);
  };

  const fetchSessions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/active?page=${page}&limit=10`);
      setSessions(response.data.data?.sessions || response.data.data || []);
      if (response.data.data?.pagination) {
        setTotalPages(response.data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    
    try {
      await api.put(`/sessions/${sessionId}/terminate`);
      toast.success('Session terminated successfully');
      fetchSessions(currentPage);
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const fetchUserActivity = async (userId) => {
    try {
      const response = await api.get(`/sessions/user/${userId}/activity`);
      setUserActivities(prev => ({
        ...prev,
        [userId]: response.data.data || []
      }));
      setShowActivities(prev => ({
        ...prev,
        [userId]: !prev[userId]
      }));
    } catch (error) {
      toast.error('Failed to load user activities');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-100 text-green-800';
      case 'CHECKED_OUT': return 'bg-blue-100 text-blue-800';
      case 'NOT_MARKED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !isAdmin(user.role)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can view session management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600">Monitor active user sessions and attendance status</p>
        </div>
        <div className="text-sm text-gray-500">
          Active Sessions: {sessions.length}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <>
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                          <div className="text-sm text-gray-500">{session.user.email}</div>
                          <div className="text-xs text-gray-400">{session.user.role}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.attendanceStatus)}`}>
                          {session.attendanceStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.loginTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchUserActivity(session.userId)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Activities"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => terminateSession(session.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Terminate Session"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showActivities[session.userId] && userActivities[session.userId] && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Recent Activities</h4>
                            {userActivities[session.userId].map((activity) => (
                              <div key={activity.id} className="text-sm text-gray-600 flex justify-between">
                                <span>{activity.action} - {activity.targetType}</span>
                                <span>{new Date(activity.createdAt).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active sessions found</p>
              </div>
            )}
          </div>
        )}
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}