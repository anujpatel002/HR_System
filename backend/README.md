# WorkZen Backend

Node.js + Express.js backend for the WorkZen HR Management System.

## Features

- JWT Authentication with HTTP-only cookies
- Role-based access control (Admin, Employee, HR Officer, Payroll Officer)
- RESTful API endpoints
- MySQL database with Prisma ORM
- Automated payroll calculations
- Comprehensive attendance and leave management

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

3. **Database setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm run seed
```

4. **Start development server**
```bash
npm run dev
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get all users (Admin/HR only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Attendance
- `POST /api/attendance/mark` - Mark attendance (check-in/out)
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/:userId` - Get attendance history

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/:userId` - Get user's leaves
- `GET /api/leave/all` - Get all leaves (HR/Admin only)
- `PUT /api/leave/approve/:id` - Approve/reject leave

### Payroll
- `POST /api/payroll/generate` - Generate payroll (Payroll Officer/Admin)
- `GET /api/payroll/:userId` - Get user's payroll
- `GET /api/payroll/all` - Get all payrolls (Payroll Officer/Admin)
- `GET /api/payroll/stats` - Get payroll statistics

## Default Accounts

After running the seed script:

- **Admin**: admin@workzen.com / admin123
- **HR Officer**: hr@workzen.com / hr123
- **Payroll Officer**: payroll@workzen.com / payroll123
- **Employee**: john.doe@workzen.com / employee123

## Payroll Calculation

The system automatically calculates:
- **Gross Pay**: Basic Salary
- **PF**: 12% of Basic Salary
- **Professional Tax**: ₹200 (fixed)
- **Unpaid Leave Deduction**: (Gross / 30) × Unpaid Leave Days
- **Net Pay**: Gross - (PF + Tax + Deductions)

## Database Schema

Key models:
- **User**: Authentication and profile data
- **Attendance**: Daily check-in/out records
- **Leave**: Leave applications and approvals
- **Payroll**: Monthly salary calculations

## Security Features

- Password hashing with bcrypt
- JWT tokens with HTTP-only cookies
- Role-based middleware protection
- CORS and Helmet security headers
- Input validation with Joi

## Deployment

1. Set environment variables on your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Start the server: `npm start`

Recommended platforms:
- **Render**: Easy Node.js deployment
- **Railway**: Simple database + app hosting
- **Heroku**: Traditional PaaS option