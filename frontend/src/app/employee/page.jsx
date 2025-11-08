'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Clock, Calendar, DollarSign, BarChart3, Settings, ChevronDown, Plane, User, Grid3X3, LogOut } from 'lucide-react';
import { usersAPI, attendanceAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutUser } from '../../store/authSlice';
import toast from 'react-hot-toast';

export default function EmployeePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
      
      const employeesWithStatus = response.data.data.map(emp => ({
        ...emp,
        status: Math.random() > 0.6 ? 'present' : Math.random() > 0.5 ? 'leave' : 'absent'
      }));
      
      setEmployees(employeesWithStatus);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getToday();
      if (response.data.data?.checkIn) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(response.data.data.checkIn));
      }
    } catch (error) {
      console.log('No attendance today');
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
      setCheckInTime(null);
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Failed to check out');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/auth/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'leave': return <Plane className="w-3 h-3 text-blue-500" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">


      <div className="flex">


        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Content Section */}
          <div className="flex-1">
            {/* Header Section */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">WorkZen</h2>
                <p className="text-sm text-gray-500">HR Management</p>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium">
                NEW
              </button>
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>

            <div className="flex">
              {/* Left Panel */}
              <div className="w-64 p-6 border-r border-gray-200">
                <div className="mb-4 text-sm text-gray-500">
                  → After login user lands here
                </div>
                
                <div className="mb-6 text-sm text-gray-500">
                  → Make cards clickable — open view-only profile
                </div>

                {/* Menu Items */}
                <div className="space-y-1 mb-8">
                  <div className="flex items-center space-x-3 text-purple-600 bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Employees</span>
                  </div>
                  
                  <div 
                    onClick={() => router.push('/employee/attendance')}
                    className="flex items-center space-x-3 text-gray-600 p-3 cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Attendance</span>
                  </div>
                  
                  <div 
                    onClick={() => router.push('/employee/leave')}
                    className="flex items-center space-x-3 text-gray-600 p-3 cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Time Off</span>
                  </div>
                  
                  <div 
                    onClick={() => router.push('/employee/payroll')}
                    className="flex items-center space-x-3 text-gray-600 p-3 cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Payroll</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-gray-600 p-3">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Reports</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-gray-600 p-3">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </div>
                </div>

                {/* Status Legend */}
                <div className="bg-gray-50 rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Status Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Green dot = present</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Plane className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-gray-600">Airplane = on leave</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Yellow dot = absent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Grid */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className="bg-white border border-gray-200 rounded p-4 hover:shadow-md transition-shadow cursor-pointer"
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
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            {/* User Profile */}
            <div className="relative mb-6">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 w-full p-3 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">EMPLOYEE</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded shadow-lg z-10">
                  <div className="p-2">
                    <button 
                      onClick={() => router.push('/employee/profile')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      My Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Check In/Out Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                  isCheckedIn 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Check In →
              </button>
              
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                  !isCheckedIn 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Check Out →
              </button>
              
              {isCheckedIn && checkInTime && (
                <p className="text-sm text-gray-600 text-center">
                  Since {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500 text-right">
              → Status changes on Check In
            </div>

            {/* Selected Employee Profile */}
            {selectedEmployee && (
              <div className="mt-6 bg-gray-50 rounded p-4">
                <h3 className="font-medium text-gray-900 mb-3">Employee Profile</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm">{selectedEmployee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedEmployee.status)}
                      <span className="text-sm capitalize">{selectedEmployee.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}