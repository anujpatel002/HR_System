'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Clock, Calendar, DollarSign, User } from 'lucide-react';
import { usersAPI, attendanceAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchEmployees();
    checkTodayAttendance();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      
      const data = response.data.data;
      const usersArray = data.users || [];
      
      const employeesWithStatus = usersArray.map(emp => ({
        ...emp,
        status: Math.random() > 0.6 ? 'present' : Math.random() > 0.5 ? 'leave' : 'absent'
      }));
      
      setEmployees(employeesWithStatus);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
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
      } else {
        setIsCheckedIn(false);
        setIsCheckedOut(false);
        setCheckInTime(null);
      }
    } catch (error) {
      console.log('No attendance today');
      setIsCheckedIn(false);
      setIsCheckedOut(false);
      setCheckInTime(null);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'leave': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'absent': return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
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
          
          {!isCheckedOut && (
            <div className={`w-3 h-3 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
          )}
        </div>
      </div>

      {checkInTime && (
        <div className={`border rounded-lg p-4 mb-6 ${
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

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            onClick={() => setSelectedEmployee(employee)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(employee.status)}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-500">{employee.designation || employee.role}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedEmployee && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{selectedEmployee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{selectedEmployee.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{selectedEmployee.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedEmployee.status)}
                <span className="font-medium capitalize">{selectedEmployee.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}