# MySQL Migration Checklist

Use this checklist to ensure your MySQL migration is complete and working.

## Pre-Migration Checklist

- [x] ✅ Prisma schema updated to MySQL
- [x] ✅ PostgreSQL migrations removed
- [x] ✅ Environment examples updated
- [x] ✅ Documentation updated
- [x] ✅ Setup scripts created

## Setup Checklist

### 1. MySQL Installation
- [ ] MySQL Server installed (8.0+ recommended)
- [ ] MySQL service running
- [ ] MySQL command-line accessible
- [ ] MySQL root password set

### 2. Database Creation
- [ ] Database created: `hr_system`
- [ ] Character set: `utf8mb4`
- [ ] Collation: `utf8mb4_unicode_ci`

### 3. Backend Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `DATABASE_URL` updated with MySQL connection string
- [ ] Format verified: `mysql://user:pass@host:3306/database`
- [ ] `JWT_SECRET` configured
- [ ] Other environment variables set

### 4. Dependencies
- [ ] Backend dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] No installation errors

### 5. Database Migration
- [ ] Migrations created (`npx prisma migrate dev --name init`)
- [ ] All tables created successfully
- [ ] Indexes created
- [ ] Foreign keys established
- [ ] No migration errors

### 6. Database Seeding (Optional)
- [ ] Seed script executed (`npm run seed`)
- [ ] Default users created
- [ ] Sample data populated
- [ ] No seeding errors

## Testing Checklist

### Backend Tests
- [ ] Server starts successfully (`npm run dev`)
- [ ] No startup errors
- [ ] Database connection established
- [ ] Health endpoint responds: `GET /api/health`

### Authentication Tests
- [ ] User registration works
- [ ] User login works (test with default accounts)
- [ ] JWT token generated
- [ ] Cookie set correctly
- [ ] Logout works

### Database Operations
- [ ] CREATE operations work
- [ ] READ operations work
- [ ] UPDATE operations work
- [ ] DELETE operations work
- [ ] Transactions work
- [ ] Foreign keys enforce correctly

### Feature Tests
#### Users Module
- [ ] Get all users
- [ ] Get user by ID
- [ ] Create new user
- [ ] Update user
- [ ] Delete user

#### Attendance Module
- [ ] Mark attendance (check-in)
- [ ] Mark attendance (check-out)
- [ ] Get attendance history
- [ ] Get today's attendance
- [ ] Calculate total hours

#### Leave Module
- [ ] Apply for leave
- [ ] Get user leaves
- [ ] Get all leaves (admin/HR)
- [ ] Approve/reject leave
- [ ] Leave status updates

#### Payroll Module
- [ ] Generate payroll
- [ ] Get user payroll
- [ ] Get all payrolls
- [ ] Calculate deductions
- [ ] Generate payslips

#### Analytics Module
- [ ] Get dashboard stats
- [ ] Get department analytics
- [ ] Get attendance analytics
- [ ] Get payroll analytics

### Frontend Tests
- [ ] Frontend starts (`npm run dev`)
- [ ] Login page loads
- [ ] Login with default accounts works
- [ ] Dashboard displays
- [ ] All routes accessible
- [ ] API calls successful

## Data Integrity Tests

### Relationships
- [ ] User → Attendance (one-to-many)
- [ ] User → Leaves (one-to-many)
- [ ] User → Payroll (one-to-many)
- [ ] User → Sessions (one-to-many)
- [ ] User → Activity Logs (one-to-many)

### Cascade Deletes
- [ ] Deleting user deletes attendance records
- [ ] Deleting user deletes leave records
- [ ] Deleting user deletes payroll records
- [ ] Deleting user deletes sessions
- [ ] Deleting user deletes activity logs

### Constraints
- [ ] Unique email constraint works
- [ ] Unique employee ID constraint works
- [ ] Date constraints work
- [ ] Status enum constraints work
- [ ] Role enum constraints work

## Performance Tests

### Query Performance
- [ ] User list loads quickly
- [ ] Attendance records load quickly
- [ ] Payroll calculations complete fast
- [ ] Analytics queries perform well
- [ ] Pagination works correctly

### Indexes
- [ ] User email index used
- [ ] User role index used
- [ ] Attendance date index used
- [ ] Leave status index used
- [ ] Payroll month/year index used

## Security Tests

### Authentication
- [ ] Passwords hashed correctly (bcrypt)
- [ ] JWT tokens secure
- [ ] HTTP-only cookies set
- [ ] Session timeout works
- [ ] Unauthorized access blocked

### Authorization
- [ ] Role-based access works
- [ ] Admin-only routes protected
- [ ] HR-only routes protected
- [ ] Payroll-only routes protected
- [ ] Employee access limited

### Data Validation
- [ ] Input validation works (Joi)
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevention works
- [ ] CORS configured correctly
- [ ] Helmet security headers set

## Production Readiness

### Configuration
- [ ] Production environment variables set
- [ ] Database connection pooling configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring setup

### Deployment
- [ ] Build succeeds
- [ ] Production database created
- [ ] Migrations run in production
- [ ] Seed data loaded (if needed)
- [ ] SSL/TLS configured
- [ ] Backup strategy in place

### Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Setup guide available
- [ ] Troubleshooting guide available
- [ ] Deployment guide available

## Post-Migration Verification

### Functionality
- [ ] All features work as before
- [ ] No breaking changes
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Edge cases handled

### Data
- [ ] Data integrity maintained
- [ ] No data loss
- [ ] Relationships correct
- [ ] Indexes effective
- [ ] Queries optimized

### User Experience
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Error messages helpful

## Troubleshooting Reference

If any checks fail, refer to:
- **MYSQL_MIGRATION_GUIDE.md** - Setup and troubleshooting
- **MYSQL_QUICKSTART.md** - Quick setup guide
- **backend/README.md** - API documentation
- **Prisma docs** - https://www.prisma.io/docs

## Common Issues & Solutions

### ❌ "Can't reach database server"
**Solution**: 
1. Verify MySQL is running: `sudo service mysql status`
2. Check DATABASE_URL format
3. Verify firewall settings

### ❌ "Database does not exist"
**Solution**:
```sql
CREATE DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ❌ "Migration failed"
**Solution**:
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

### ❌ "Authentication failed"
**Solution**:
1. Check username/password in DATABASE_URL
2. Grant permissions:
```sql
GRANT ALL PRIVILEGES ON hr_system.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## Final Sign-Off

Once all checks pass:

- [ ] ✅ Migration complete
- [ ] ✅ All features tested
- [ ] ✅ Documentation reviewed
- [ ] ✅ Team notified
- [ ] ✅ Ready for use

---

**Date Completed**: _______________

**Tested By**: _______________

**Notes**: _______________
