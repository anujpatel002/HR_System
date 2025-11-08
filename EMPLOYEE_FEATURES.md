# Employee Features - WorkZen HR System

## Overview
The employee portal provides comprehensive self-service features for employees to manage their HR-related activities.

## Features Added

### 1. Employee Dashboard (`/employee`)
- **Main Interface**: Clean, intuitive dashboard matching the provided design
- **Employee Directory**: View all employees with status indicators
- **Quick Actions**: Check-in/Check-out functionality
- **Profile Management**: Access to personal profile
- **Navigation**: Easy access to all employee features

### 2. Leave Management (`/employee/leave`)
- **Apply for Leave**: Submit leave applications with different types:
  - Casual Leave
  - Sick Leave
  - Annual Leave
  - Maternity Leave
  - Paternity Leave
- **Leave History**: View all past and pending leave applications
- **Status Tracking**: Real-time status updates (Pending, Approved, Rejected)
- **Leave Duration**: Automatic calculation of leave days

### 3. Attendance History (`/employee/attendance`)
- **Monthly View**: Filter attendance by month and year
- **Statistics Dashboard**: 
  - Total working days
  - Present days
  - Absent days
  - Total hours worked
  - Attendance percentage
- **Detailed Records**: Check-in/check-out times with total hours
- **Visual Indicators**: Color-coded status indicators

### 4. Payroll Management (`/employee/payroll`)
- **Payslip History**: View all historical payslips
- **Detailed Breakdown**: 
  - Basic salary
  - Gross salary
  - Deductions (PF, Professional Tax, Others)
  - Net salary
- **Download Feature**: Export payslips as HTML files
- **Employee Information**: Complete employment details

### 5. Profile Management (`/employee/profile`)
- **View Profile**: Complete personal and employment information
- **Edit Profile**: Update personal details (name, phone, address, etc.)
- **Employment Info**: View role, salary, and join date
- **Secure Updates**: Email cannot be changed for security

## Navigation Structure

```
/employee
├── /leave          # Leave management
├── /attendance     # Attendance history
├── /payroll        # Payslip management
└── /profile        # Profile management
```

## Key Features

### Security
- Role-based access control
- JWT authentication
- Secure profile updates
- Data validation

### User Experience
- Responsive design
- Intuitive navigation
- Real-time updates
- Toast notifications
- Loading states

### Data Management
- Automatic calculations
- Date filtering
- Search functionality
- Export capabilities

## Sample Data
The system includes sample data for testing:
- 30 days of attendance records
- 2 leave applications (1 pending, 1 approved)
- 2 payroll records
- Complete employee profiles

## Default Employee Account
- **Email**: john.doe@workzen.com
- **Password**: employee123
- **Role**: Employee
- **Department**: Engineering
- **Designation**: Software Developer

## Technical Implementation

### Frontend
- Next.js 14 with App Router
- Tailwind CSS for styling
- React hooks for state management
- Axios for API calls
- React Hot Toast for notifications

### Backend Integration
- RESTful API endpoints
- Prisma ORM for database operations
- JWT authentication
- Input validation with Joi
- Error handling

### Database Schema
- User management
- Attendance tracking
- Leave management
- Payroll records
- Role-based permissions

## Future Enhancements
- Document upload for leave applications
- Calendar integration
- Mobile app support
- Advanced reporting
- Performance analytics
- Team collaboration features