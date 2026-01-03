'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { usersAPI, attendanceAPI } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManagerAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'MANAGER') {
      toast.error('Access denied');
      router.push('/dashboard');
      return;
    }
    fetchTeamAttendance();
  }, [user, selectedDate]);

  const fetchTeamAttendance = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const usersRes = await usersAPI.getAll({ limit: 100 });
      const users = usersRes.data.data.users || [];
      // Include all users except self (manager sees all team members)
      const myTeam = users.filter(u => u.id !== user.id);
      console.log('Manager ID:', user.id);
      console.log('All users:', users);
      console.log('My team:', myTeam);
      setTeamMembers(myTeam);

      // Fetch attendance for selected date
      const date = new Date(selectedDate);
      const promises = myTeam.map(member =>
        attendanceAPI.getByUser(member.id, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          limit: 100
        }).catch(() => ({ data: { data: { attendance: [] } } }))
      );

      const results = await Promise.all(promises);
      const allAttendance = results.flatMap((res, idx) => {
        const data = res.data.data;
        const records = Array.isArray(data) ? data : data.attendance || [];
        console.log(`Attendance for ${myTeam[idx].name}:`, records);
        return records.map(r => ({ ...r, user: myTeam[idx] }));
      });

      console.log('All attendance records:', allAttendance);
      console.log('Selected date:', selectedDate);

      // Filter by selected date - normalize both dates to YYYY-MM-DD
      const selectedDateStr = selectedDate;
      const filtered = allAttendance.filter(r => {
        // Get date from record and normalize to YYYY-MM-DD
        const recordDateObj = new Date(r.date);
        const recordDateStr = `${recordDateObj.getFullYear()}-${String(recordDateObj.getMonth() + 1).padStart(2, '0')}-${String(recordDateObj.getDate()).padStart(2, '0')}`;
        
        console.log('Comparing:', recordDateStr, 'with', selectedDateStr, 'for', r.user?.name);
        return recordDateStr === selectedDateStr;
      });

      console.log('Filtered records:', filtered);

      // Add absent employees
      const presentEmployeeIds = filtered.map(r => r.userId);
      const absentEmployees = myTeam.filter(emp => !presentEmployeeIds.includes(emp.id));
      const absentRecords = absentEmployees.map(emp => ({
        id: `absent-${emp.id}`,
        userId: emp.id,
        date: selectedDate,
        checkIn: null,
        checkOut: null,
        totalHours: null,
        status: 'ABSENT',
        user: emp
      }));

      setAttendanceData([...filtered, ...absentRecords].sort((a, b) => 
        a.user.name.localeCompare(b.user.name)
      ));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: teamMembers.length,
    present: attendanceData.filter(a => a.status === 'PRESENT').length,
    absent: attendanceData.filter(a => a.status === 'ABSENT').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Attendance</h1>
          <p className="text-gray-600">Monitor your team's attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Team</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.user?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.user?.department || '-'}
                  </td>
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
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {attendanceData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
