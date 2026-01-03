'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { format } from 'date-fns';

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes] = await Promise.all([
        attendanceAPI.getToday(),
        attendanceAPI.getByUser(user.id, {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      ]);

      setTodayAttendance(todayRes.data.data);
      const historyData = historyRes.data.data;
      setAttendanceHistory(Array.isArray(historyData) ? historyData : historyData.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (type) => {
    try {
      await attendanceAPI.mark(type);
      toast.success(`${type === 'checkin' ? 'Checked in' : 'Checked out'} successfully!`);
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
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
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Track your daily attendance</p>
      </div>

      {/* Today's Attendance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
              {todayAttendance ? (
                <div className="space-y-1">
                  {todayAttendance.checkIn && (
                    <p className="text-sm">
                      <span className="font-medium">Check In:</span> {format(new Date(todayAttendance.checkIn), 'HH:mm')}
                    </p>
                  )}
                  {todayAttendance.checkOut && (
                    <p className="text-sm">
                      <span className="font-medium">Check Out:</span> {format(new Date(todayAttendance.checkOut), 'HH:mm')}
                    </p>
                  )}
                  {todayAttendance.totalHours && (
                    <p className="text-sm">
                      <span className="font-medium">Total Hours:</span> {todayAttendance.totalHours}h
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendance marked today</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            {!todayAttendance?.checkIn ? (
              <button
                onClick={() => handleMarkAttendance('checkin')}
                className="btn-primary flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Check In</span>
              </button>
            ) : !todayAttendance?.checkOut ? (
              <button
                onClick={() => handleMarkAttendance('checkout')}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Check Out</span>
              </button>
            ) : (
              <div className="text-green-600 font-medium">
                ✓ Attendance Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month's Attendance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {['ADMIN', 'HR_OFFICER'].includes(user?.role) && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </td>
                  {['ADMIN', 'HR_OFFICER'].includes(user?.role) && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.users?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.users?.department || '-'}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalHours ? `${record.totalHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'ABSENT'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {attendanceHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this month
            </div>
          )}
        </div>
      </div>
    </div>
  );
}