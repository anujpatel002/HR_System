# WorkZen - Smart HR Management System

A complete HR management system built with Next.js, Node.js, and MySQL.

> **🔄 Database Migration Notice**: This project now uses **MySQL** instead of PostgreSQL.
> 
> **New to this project?** See [MYSQL_QUICKSTART.md](MYSQL_QUICKSTART.md) for quick setup.
> 
> **Migrating from PostgreSQL?** See [POSTGRESQL_TO_MYSQL_MIGRATION.md](POSTGRESQL_TO_MYSQL_MIGRATION.md) for migration details.

## Features

- 🔐 JWT Authentication & Role-based Access Control
- 👥 User & Role Management (Admin, Employee, HR Officer, Payroll Officer)
- ⏰ Attendance & Leave Management
- 💰 Automated Payroll Processing
- 📊 Analytics Dashboard with Charts
- 📱 Responsive Design

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: MySQL
- **Authentication**: JWT with HTTP-only cookies

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL database (8.0+ recommended)
- Git

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd HR_System

# Frontend setup
cd frontend
npm install
cd ..

# Backend setup
cd backend
npm install
```

2. **Database setup**
```bash
cd backend
# Copy environment file
cp .env.example .env
# Edit .env with your MySQL database URL

# Create database first in MySQL
# mysql -u root -p
# CREATE DATABASE hr_system;

# Run migrations
npx prisma migrate dev
npx prisma generate

# Seed database with default users
npm run seed
```

3. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Accounts

After running the seed script (`npm run seed` in backend), use these accounts:

### Admin Account
- **Email**: admin@workzen.com
- **Password**: admin123
- **Access**: Full system access, user management, all modules

### HR Officer Account
- **Email**: hr@workzen.com
- **Password**: hr123
- **Access**: User management, leave approvals, analytics

### Payroll Officer Account
- **Email**: payroll@workzen.com
- **Password**: payroll123
- **Access**: Payroll generation, salary management, analytics

### Employee Account
- **Email**: john.doe@workzen.com
- **Password**: employee123
- **Access**: Personal attendance, leave applications, payslips

## API Documentation

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - List all users (Admin only)
- `PUT /api/users/:id` - Update user profile

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/:userId` - Get attendance logs

### Leave
- `POST /api/leave/apply` - Apply for leave
- `PUT /api/leave/approve/:id` - Approve/reject leave

### Payroll
- `POST /api/payroll/generate` - Generate payroll
- `GET /api/payroll/:userId` - Get payslip

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Render/Railway)
```bash
cd backend
# Set environment variables
# Deploy to your preferred platform
```

## Security Documentation

⚠️ **IMPORTANT**: Review these security documents before deployment:

- **[SECURITY_FIXES.md](./SECURITY_FIXES.md)** - Critical security vulnerabilities fixed
- **[AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)** - How JWT authentication works
- **[ACCESS_CONTROL.md](./ACCESS_CONTROL.md)** - Role-based access control implementation

### Key Security Features
- ✅ JWT tokens stored in httpOnly cookies (XSS protection)
- ✅ Role-based access control (RBAC)
- ✅ Backend validation with Joi schemas
- ✅ Next.js API proxy (hides backend URL)
- ✅ Secure session management

## Performance Optimization

🚀 **The system has been optimized for maximum speed!**

- **[PERFORMANCE_FIXES_SUMMARY.md](./PERFORMANCE_FIXES_SUMMARY.md)** - Quick start guide
- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - Technical details

### Performance Features
- ⚡ Database indexes (50-70% faster queries)
- ⚡ API response caching (80-90% faster repeat requests)
- ⚡ React component optimization (40-50% fewer re-renders)
- ⚡ Optimized useEffect dependencies (no infinite loops)

**Result:** Page loads are 50-70% faster! (3-5s → 1-2s)

## License

MIT License
