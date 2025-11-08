# WorkZen - Smart HR Management System

A complete HR management system built with Next.js, Node.js, and PostgreSQL.

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
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
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
# Edit .env with your database URL

# Run migrations
npx prisma migrate dev
npx prisma generate
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

## Default Admin Account
- Email: admin@workzen.com
- Password: admin123

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

## License

MIT License# HR_System
