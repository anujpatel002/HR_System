'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usersAPI, attendanceAPI, leaveAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'MANAGER') {
      toast.error('Access denied. Managers only.');
      router.push('/dashboard');
      return;
    }
    fetchDashboardData();
    checkMyAttendance();
  }, [user]);

  const checkMyAttendance = async () => {
    try {
      const response = await attendanceAPI.getToday();
      const attendance = response.data.data;
      if (attendance?.checkIn) {
        setCheckInTime(new Date(attendance.checkIn));
        if (attendance.checkOut) {
          setIsCheckedIn(false);
          setIsCheckedOut(true);
          setCheckOutTime(new Date(attendance.checkOut));
        } else {
          setIsCheckedIn(true);
          setIsCheckedOut(false);
        }
      }
    } catch (error) {
      setIsCheckedIn(false);
      setIsCheckedOut(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceAPI.mark('checkin');
      setIsCheckedIn(true);
      setCheckInTime(new Date());
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceAPI.mark('checkout');
      setIsCheckedIn(false);
      setIsCheckedOut(true);
      setCheckOutTime(new Date());
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Failed to check out');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const usersRes = await usersAPI.getAll({ limit: 100 });
      const users = usersRes.data.data.users || [];
      const myTeam = users.filter(u => u.id !== user.id);
      setTeamMembers(myTeam);

      // Fetch pending leaves for team only
      try {
        const leavesRes = await leaveAPI.getAll({ status: 'PENDING', limit: 50 });
        const leaves = leavesRes.data.data.leaves || [];
        // Filter to show only team member leaves
        const teamLeaves = leaves.filter(l => myTeam.some(m => m.id === l.userId));
        setPendingLeaves(teamLeaves);
      } catch (err) {
        console.error('Error fetching leaves:', err);
        setPendingLeaves([]);
      }

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const date = new Date();
      const attendancePromises = myTeam.map(member =>
        attendanceAPI.getByUser(member.id, { 
          month: date.getMonth() + 1,
          year: date.getFullYear()
        }).catch(() => ({ data: { data: { attendance: [] } } }))
      );
      
      const attendanceResults = await Promise.all(attendancePromises);
      const allAttendance = attendanceResults.flatMap((res, idx) => {
        const data = res.data.data;
        const records = Array.isArray(data) ? data : data.attendance || [];
        return records.map(r => ({ ...r, user: myTeam[idx] }));
      });
      
      // Filter for today only
      const todayRecords = allAttendance.filter(r => {
        const recordDate = new Date(r.date);
        const todayDate = new Date();
        return recordDate.getFullYear() === todayDate.getFullYear() &&
               recordDate.getMonth() === todayDate.getMonth() &&
               recordDate.getDate() === todayDate.getDate();
      });
      
      setTodayAttendance(todayRecords);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await leaveAPI.updateStatus(leaveId, status);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const stats = {
    totalTeam: teamMembers.length,
    presentToday: todayAttendance.filter(a => a.status === 'PRESENT').length,
    absentToday: teamMembers.length - todayAttendance.length,
    pendingLeaves: pendingLeaves.length
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
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600">Manage your team's attendance and leave requests</p>
        </div>
        <div className="flex items-center space-x-4">
          {!isCheckedOut ? (
            <>
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`py-2 px-4 rounded font-medium transition-colors ${
                  isCheckedIn 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Check In
              </button>
              
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className={`py-2 px-4 rounded font-medium transition-colors ${
                  !isCheckedIn 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Check Out
              </button>
            </>
          ) : (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded font-medium">
              Attendance Marked ✓
            </div>
          )}
        </div>
      </div>

      {checkInTime && (
        <div className={`border rounded-lg p-4 ${
          isCheckedOut 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={isCheckedOut ? 'text-blue-800' : 'text-green-800'}>
            {isCheckedOut 
              ? `Attendance completed - Checked in at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | Checked out at ${checkOutTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `You checked in at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeam}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
        </div>
        <div className="p-6">
          {pendingLeaves.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pending leave requests</p>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{leave.users?.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {leave.type} - {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{leave.reason}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Team</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today's Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map(member => {
                const attendance = todayAttendance.find(a => a.userId === member.id);
                return (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Present
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {teamMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No team members found</div>
          )}
        </div>
      </div>
    </div>
  );
}
