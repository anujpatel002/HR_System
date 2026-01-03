'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { format } from 'date-fns';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(user?.role);

  useEffect(() => {
    if (isAdminOrHR) {
      fetchEmployees();
    } else {
      fetchMyAttendance();
    }
  }, []);

  useEffect(() => {
    if (isAdminOrHR && allEmployees.length > 0) {
      fetchDepartmentAttendance();
    }
  }, [selectedDepartment, selectedDate, allEmployees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll({ limit: 100 });
      const users = res.data.data.users || [];
      const filtered = users.filter(u => user.role === 'ADMIN' || u.role === 'EMPLOYEE');
      setAllEmployees(filtered);
      
      const depts = [...new Set(filtered.map(u => u.department).filter(Boolean))];
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const date = new Date(selectedDate);
      const res = await attendanceAPI.getByUser(user.id, {
        month: date.getMonth() + 1,
        year: date.getFullYear()
      });
      const data = res.data.data;
      setAttendanceData(Array.isArray(data) ? data : data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentAttendance = async () => {
    try {
      setLoading(true);
      const employeesToFetch = selectedDepartment === 'all' 
        ? allEmployees 
        : allEmployees.filter(e => e.department === selectedDepartment);

      const date = new Date(selectedDate);
      const promises = employeesToFetch.map(emp => 
        attendanceAPI.getByUser(emp.id, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          limit: 100
        }).catch(() => ({ data: { data: { attendance: [] } } }))
      );

      const results = await Promise.all(promises);
      const allAttendance = results.flatMap((res, idx) => {
        const data = res.data.data;
        const records = Array.isArray(data) ? data : data.attendance || [];
        return records.map(r => ({ ...r, users: employeesToFetch[idx] }));
      });

      // Filter by selected date
      const filtered = allAttendance.filter(r => {
        const recordDate = new Date(r.date);
        const selectedDateObj = new Date(selectedDate);
        return recordDate.getFullYear() === selectedDateObj.getFullYear() &&
               recordDate.getMonth() === selectedDateObj.getMonth() &&
               recordDate.getDate() === selectedDateObj.getDate();
      });

      // Add absent employees
      const presentEmployeeIds = filtered.map(r => r.userId);
      const absentEmployees = employeesToFetch.filter(emp => !presentEmployeeIds.includes(emp.id));
      const absentRecords = absentEmployees.map(emp => ({
        id: `absent-${emp.id}`,
        userId: emp.id,
        date: selectedDate,
        checkIn: null,
        checkOut: null,
        totalHours: null,
        status: 'ABSENT',
        users: emp
      }));

      setAttendanceData([...filtered, ...absentRecords].sort((a, b) => a.users.name.localeCompare(b.users.name)));
    } catch (error) {
      console.error('Error fetching department attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (type, employeeId) => {
    try {
      await attendanceAPI.mark(type, employeeId);
      toast.success(`${type === 'checkin' ? 'Checked in' : 'Checked out'} successfully!`);
      if (isAdminOrHR) {
        fetchDepartmentAttendance();
      } else {
        fetchMyAttendance();
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">{isAdminOrHR ? 'Manage employee attendance' : 'Track your daily attendance'}</p>
        </div>
        {isAdminOrHR && (
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
            <Users className="w-5 h-5 text-gray-600" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input-field"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!isAdminOrHR && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                {attendanceData.find(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ? (
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Status:</span> Marked</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No attendance marked today</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => handleMarkAttendance('checkin', user.id)} className="btn-primary flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Check In</span>
              </button>
              <button onClick={() => handleMarkAttendance('checkout', user.id)} className="btn-danger flex items-center space-x-2">
                <XCircle className="h-4 w-4" />
                <span>Check Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isAdminOrHR ? `Attendance for ${format(new Date(selectedDate), 'MMMM d, yyyy')} - ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}` : "This Month's Attendance"}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                {isAdminOrHR && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {isAdminOrHR && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                  {isAdminOrHR && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.users?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.users?.department || '-'}</td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.totalHours ? `${record.totalHours}h` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${record.status === 'PRESENT' ? 'badge-green' : record.status === 'ABSENT' ? 'badge-red' : 'badge-yellow'}`}>
                      {record.status}
                    </span>
                  </td>
                  {isAdminOrHR && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {!record.checkIn && (
                          <button onClick={() => handleMarkAttendance('checkin', record.userId)} className="text-accent-green hover:text-green-700 text-xs font-medium">Check In</button>
                        )}
                        {record.checkIn && !record.checkOut && (
                          <button onClick={() => handleMarkAttendance('checkout', record.userId)} className="text-accent-red hover:text-red-700 text-xs font-medium">Check Out</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {attendanceData.length === 0 && (
            <div className="text-center py-8 text-gray-500">No attendance records found</div>
          )}
        </div>
      </div>
    </div>
  );
}