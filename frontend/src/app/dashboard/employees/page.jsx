'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Clock, Calendar, DollarSign, BarChart3, Settings, ChevronDown, Plane, User, Grid3X3 } from 'lucide-react';
import { usersAPI, attendanceAPI } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import Pagination from '../../../components/Pagination';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    fetchEmployees(1);
    // checkTodayAttendance();
  }, []);

  const handlePageChange = (page) => {
    fetchEmployees(page);
  };

  const fetchEmployees = (page = 1) => {
    setLoading(true);
    
    // Mock data
    const mockEmployees = [
      {
        id: '1',
        employeeId: 'EMP001',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'EMPLOYEE',
        department: 'IT',
        designation: 'Developer',
        basicSalary: 50000
      },
      {
        id: '2',
        employeeId: 'EMP002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'EMPLOYEE',
        department: 'HR',
        designation: 'HR Manager',
        basicSalary: 60000
      },
      {
        id: '3',
        employeeId: 'EMP003',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'EMPLOYEE',
        department: 'Finance',
        designation: 'Accountant',
        basicSalary: 45000
      }
    ];
    
    const employeesWithStatus = mockEmployees.map(emp => ({
      ...emp,
      status: Math.random() > 0.6 ? 'present' : Math.random() > 0.5 ? 'leave' : 'absent'
    }));
    
    setEmployees(employeesWithStatus);
    setTotalPages(1);
    setTotalEmployees(mockEmployees.length);
    setCurrentPage(page);
    setLoading(false);
  };

  // const checkTodayAttendance = async () => {
  //   try {
  //     const response = await attendanceAPI.getToday();
  //     if (response.data.data?.checkIn) {
  //       setIsCheckedIn(true);
  //       setCheckInTime(new Date(response.data.data.checkIn));
  //     }
  //   } catch (error) {
  //     console.log('No attendance today');
  //   }
  // };

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date());
    toast.success('Checked in successfully!');
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    toast.success('Checked out successfully!');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        {/* Company Logo/Name */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">WorkZen</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 px-3">
          <div className="space-y-1">
            <div className="bg-purple-50 border-l-4 border-purple-500 px-3 py-2 rounded-r">
              <div className="flex items-center space-x-3">
                <Grid3X3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Dashboard</span>
              </div>
            </div>
            
            <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Attendance</span>
              </div>
            </div>
            
            <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Leave</span>
              </div>
            </div>
            
            <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Payroll</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">WorkZen</h2>
                <p className="text-sm text-gray-500">HR Management</p>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                NEW
              </button>
            </div>
            
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">EMPLOYEE</span>
                <span className="text-blue-600 cursor-pointer">Logout</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1">
          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="mb-4 text-sm text-gray-500">
              → After login user lands here
            </div>
            
            <div className="mb-4 text-sm text-gray-500">
              → Make cards clickable — open view-only profile
            </div>

            {/* Left Panel with Menu and Status */}
            <div className="flex">
              <div className="w-64 mr-6">
                {/* Menu Items */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-purple-600 bg-purple-50 p-2 rounded border-l-4 border-purple-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Employees</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600 p-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Attendance</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600 p-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Time Off</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600 p-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Payroll</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600 p-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Reports</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-600 p-2">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </div>
                  </div>
                </div>

                {/* Status Legend */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
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
              <div className="flex-1">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Employees ({totalEmployees})</h3>
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredEmployees.map((employee) => (
                          <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{employee.name}</h4>
                                <p className="text-sm text-gray-500">{employee.designation}</p>
                              </div>
                              {getStatusIcon(employee.status)}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>ID: {employee.employeeId}</p>
                              <p>Dept: {employee.department}</p>
                              <p>Role: {employee.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {employees.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No employees found</p>
                        </div>
                      )}
                      
                      {totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Profile & Attendance */}
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            {/* User Profile */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">EMPLOYEE</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Check In/Out Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300"
              >
                Check In →
              </button>
              
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:bg-gray-100"
              >
                Check Out →
              </button>
            </div>

            <div className="text-sm text-gray-500 text-right">
              → Status changes on Check In
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}