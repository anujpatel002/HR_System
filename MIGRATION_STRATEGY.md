# 🔄 MIGRATION STRATEGY - From Current to Enhanced Schema

## 📊 MIGRATION OVERVIEW

**Current State**: 10 tables (partially normalized)  
**Target State**: 25 tables (fully normalized, production-ready)  
**Approach**: Incremental migration with zero data loss  
**Estimated Time**: 4-6 hours (including testing)

---

## 🎯 MIGRATION PHASES

### Phase 1: CREATE NEW TABLES (No Breaking Changes)
**Duration**: 30 minutes  
**Risk**: ZERO  
**Rollback**: Easy (just drop new tables)

#### Tables to Create:
1. `roles` - Role management
2. `permissions` - Permission definitions
3. `role_permissions` - Role-permission mapping
4. `departments` - Department hierarchy
5. `designations` - Job titles with levels
6. `leave_types` - Leave categories
7. `leave_balances` - Per-employee leave tracking
8. `leave_approvals` - Approval chain
9. `employee_documents` - Document management
10. `attendance_summary` - Performance optimization
11. `password_resets` - Password reset tokens
12. `email_verifications` - Email verification tokens
13. `holidays` - Company holiday calendar

**SQL Script**:
```sql
-- Run this first (creates new tables without touching existing)
-- See: migration_phase1.sql
```

---

### Phase 2: SEED DEFAULT DATA
**Duration**: 15 minutes  
**Risk**: ZERO  
**Rollback**: Easy (delete seeded data)

#### Data to Seed:

**1. Roles**
```sql
INSERT INTO roles (id, name, description) VALUES
('role-admin', 'ADMIN', 'Full system access'),
('role-hr', 'HR_OFFICER', 'HR management access'),
('role-payroll', 'PAYROLL_OFFICER', 'Payroll management access'),
('role-manager', 'MANAGER', 'Team management access'),
('role-employee', 'EMPLOYEE', 'Basic employee access');
```

**2. Permissions** (50+ permissions)
```sql
-- users module
INSERT INTO permissions (module, action) VALUES
('users', 'create'),
('users', 'read'),
('users', 'update'),
('users', 'delete'),
-- attendance module
('attendance', 'mark'),
('attendance', 'view_own'),
('attendance', 'view_all'),
-- leaves module
('leaves', 'apply'),
('leaves', 'approve'),
('leaves', 'view_own'),
('leaves', 'view_all'),
-- payroll module
('payroll', 'generate'),
('payroll', 'view_own'),
('payroll', 'view_all');
```

**3. Role-Permission Mapping**
```sql
-- ADMIN gets all permissions
-- HR_OFFICER gets user, leave, attendance permissions
-- PAYROLL_OFFICER gets payroll permissions
-- EMPLOYEE gets own data permissions
```

**4. Leave Types**
```sql
INSERT INTO leave_types (name, code, defaultBalance, isPaid) VALUES
('Sick Leave', 'SICK', 12, true),
('Casual Leave', 'CASUAL', 12, true),
('Annual Leave', 'ANNUAL', 20, true),
('Maternity Leave', 'MATERNITY', 180, true),
('Paternity Leave', 'PATERNITY', 15, true),
('Unpaid Leave', 'UNPAID', 0, false);
```

**5. Departments**
```sql
INSERT INTO departments (name, code) VALUES
('Information Technology', 'IT'),
('Human Resources', 'HR'),
('Finance', 'FIN'),
('Marketing', 'MKT'),
('Operations', 'OPS'),
('Sales', 'SALES');
```

**6. Designations**
```sql
INSERT INTO designations (title, level) VALUES
('Intern', 1),
('Junior Developer', 2),
('Developer', 3),
('Senior Developer', 4),
('Team Lead', 5),
('Manager', 6),
('Director', 7);
```

---

### Phase 3: MIGRATE EXISTING DATA
**Duration**: 1-2 hours  
**Risk**: MEDIUM  
**Rollback**: Restore from backup

#### 3.1 Migrate Users → Roles

**Current**:
```prisma
model users {
  role Role @default(EMPLOYEE) // Enum
}
```

**Target**:
```prisma
model users {
  roleId String // FK to roles table
}
```

**Migration Script**:
```sql
-- Add roleId column (nullable first)
ALTER TABLE users ADD COLUMN roleId VARCHAR(36);

-- Map enum values to role IDs
UPDATE users SET roleId = 'role-admin' WHERE role = 'ADMIN';
UPDATE users SET roleId = 'role-hr' WHERE role = 'HR_OFFICER';
UPDATE users SET roleId = 'role-payroll' WHERE role = 'PAYROLL_OFFICER';
UPDATE users SET roleId = 'role-manager' WHERE role = 'MANAGER';
UPDATE users SET roleId = 'role-employee' WHERE role = 'EMPLOYEE';

-- Make roleId NOT NULL
ALTER TABLE users MODIFY roleId VARCHAR(36) NOT NULL;

-- Add foreign key
ALTER TABLE users ADD CONSTRAINT fk_users_role 
  FOREIGN KEY (roleId) REFERENCES roles(id);

-- Drop old role column (AFTER TESTING)
-- ALTER TABLE users DROP COLUMN role;
```

#### 3.2 Migrate Department Strings → Departments Table

**Migration Script**:
```sql
-- Create department records from existing data
INSERT INTO departments (id, name, code)
SELECT 
  UUID() as id,
  department as name,
  UPPER(LEFT(department, 3)) as code
FROM users 
WHERE department IS NOT NULL
GROUP BY department;

-- Add departmentId to employees table
ALTER TABLE employees ADD COLUMN departmentId VARCHAR(36);

-- Map department strings to IDs
UPDATE employees e
INNER JOIN users u ON e.userId = u.id
INNER JOIN departments d ON u.department = d.name
SET e.departmentId = d.id;

-- Add foreign key
ALTER TABLE employees ADD CONSTRAINT fk_employees_department
  FOREIGN KEY (departmentId) REFERENCES departments(id);
```

#### 3.3 Migrate Designation Strings → Designations Table

**Migration Script**:
```sql
-- Similar to departments migration
INSERT INTO designations (id, title, level)
SELECT 
  UUID() as id,
  designation as title,
  CASE 
    WHEN designation LIKE '%Intern%' THEN 1
    WHEN designation LIKE '%Junior%' THEN 2
    WHEN designation LIKE '%Senior%' THEN 4
    WHEN designation LIKE '%Lead%' THEN 5
    WHEN designation LIKE '%Manager%' THEN 6
    WHEN designation LIKE '%Director%' THEN 7
    ELSE 3
  END as level
FROM users 
WHERE designation IS NOT NULL
GROUP BY designation;

-- Add designationId to employees
ALTER TABLE employees ADD COLUMN designationId VARCHAR(36);

-- Map designation strings to IDs
UPDATE employees e
INNER JOIN users u ON e.userId = u.id
INNER JOIN designations d ON u.designation = d.title
SET e.designationId = d.id;
```

#### 3.4 Migrate Employee Data from Users → Employees

**Current Issue**: Employee data scattered in both `users` and `employees` tables

**Migration Script**:
```sql
-- Ensure all users have employee records
INSERT INTO employees (id, userId, employeeCode, firstName, lastName)
SELECT 
  UUID(),
  u.id,
  COALESCE(u.employeeId, CONCAT('EMP-', SUBSTRING(u.id, 1, 8))),
  SUBSTRING_INDEX(u.name, ' ', 1),
  SUBSTRING_INDEX(u.name, ' ', -1)
FROM users u
LEFT JOIN employees e ON u.userId = e.id
WHERE e.id IS NULL;

-- Migrate fields from users to employees
UPDATE employees e
INNER JOIN users u ON e.userId = u.id
SET 
  e.dateOfBirth = u.dateOfBirth,
  e.gender = u.gender,
  e.maritalStatus = u.maritalStatus,
  e.nationality = u.nationality,
  e.personalEmail = u.personalEmail,
  e.mobile = u.mobile,
  e.address = u.address,
  e.dateOfJoining = u.dateOfJoining,
  e.basicSalary = u.basicSalary,
  e.bankName = u.bankName,
  e.accountNumber = u.accountNumber,
  e.ifscCode = u.ifscCode,
  e.panNo = u.panNo,
  e.uanNo = u.uanNo;
```

#### 3.5 Create Leave Balances for All Employees

**Migration Script**:
```sql
-- Create leave balances for current year
INSERT INTO leave_balances (id, employeeId, leaveTypeId, year, allocated, available)
SELECT 
  UUID(),
  e.id,
  lt.id,
  YEAR(CURDATE()),
  lt.defaultBalance,
  lt.defaultBalance
FROM employees e
CROSS JOIN leave_types lt
WHERE e.isActive = true;
```

#### 3.6 Migrate Leaves → Add Leave Type FK

**Migration Script**:
```sql
-- Add leaveTypeId column
ALTER TABLE leaves ADD COLUMN leaveTypeId VARCHAR(36);

-- Map enum to leave type IDs
UPDATE leaves l
INNER JOIN leave_types lt ON l.type = lt.code
SET l.leaveTypeId = lt.id;

-- Make NOT NULL and add FK
ALTER TABLE leaves MODIFY leaveTypeId VARCHAR(36) NOT NULL;
ALTER TABLE leaves ADD CONSTRAINT fk_leaves_leavetype
  FOREIGN KEY (leaveTypeId) REFERENCES leave_types(id);
```

#### 3.7 Create Leave Approvals from Existing Leaves

**Migration Script**:
```sql
-- Create approval records for all existing leaves
INSERT INTO leave_approvals (id, leaveId, approverId, level, status, approvedAt)
SELECT 
  UUID(),
  l.id,
  (SELECT id FROM users WHERE role = 'HR_OFFICER' LIMIT 1), -- Default approver
  1,
  CASE 
    WHEN l.status = 'APPROVED' THEN 'APPROVED'
    WHEN l.status = 'REJECTED' THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  CASE WHEN l.status IN ('APPROVED', 'REJECTED') THEN l.updatedAt ELSE NULL END
FROM leaves l;
```

---

### Phase 4: UPDATE APPLICATION CODE
**Duration**: 2-3 hours  
**Risk**: MEDIUM  
**Rollback**: Git revert

#### 4.1 Update Prisma Schema
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema_backup.prisma

# Replace with enhanced schema
cp prisma/schema_enhanced.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate
```

#### 4.2 Update Controllers

**Before**:
```javascript
// userController.js
const user = await prisma.users.findUnique({
  where: { id },
  select: { role: true, department: true }
});
```

**After**:
```javascript
const user = await prisma.users.findUnique({
  where: { id },
  include: { 
    role: true,
    employee: {
      include: {
        department: true,
        designation: true
      }
    }
  }
});
```

#### 4.3 Update Middleware

**roleMiddleware.js** - Update to use role table:
```javascript
// Before
if (!allowedRoles.includes(req.user.role)) {
  return res.status(403).json({ error: 'Access denied' });
}

// After
if (!allowedRoles.includes(req.user.role.name)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

#### 4.4 Create New Controllers

1. **rolesController.js** - Role management
2. **departmentsController.js** - Department CRUD
3. **designationsController.js** - Designation CRUD
4. **leaveTypesController.js** - Leave type management
5. **leaveBalancesController.js** - Leave balance tracking
6. **documentsController.js** - Document upload/download
7. **holidaysController.js** - Holiday calendar

---

### Phase 5: TESTING
**Duration**: 2-3 hours  
**Risk**: LOW  
**Rollback**: N/A

#### Test Cases:

**Authentication**
- [ ] Login with all roles
- [ ] JWT token generation
- [ ] Role-based access control

**User Management**
- [ ] Create user with new role FK
- [ ] Update user profile
- [ ] View user with department/designation

**Attendance**
- [ ] Mark attendance
- [ ] View attendance summary
- [ ] Generate monthly report

**Leave Management**
- [ ] Apply leave (check balance)
- [ ] Approve/reject leave
- [ ] View leave history
- [ ] Check leave balance

**Payroll**
- [ ] Generate payroll
- [ ] View payslip
- [ ] Export payroll report

**New Features**
- [ ] Upload document
- [ ] View holiday calendar
- [ ] Department hierarchy
- [ ] Leave approval chain

---

### Phase 6: CLEANUP (Optional)
**Duration**: 30 minutes  
**Risk**: LOW  
**Rollback**: Restore columns

#### Remove Deprecated Fields:
```sql
-- After confirming everything works
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users DROP COLUMN department;
ALTER TABLE users DROP COLUMN designation;
ALTER TABLE users DROP COLUMN basicSalary;
ALTER TABLE users DROP COLUMN bankName;
-- etc.
```

---

## 🔒 SAFETY MEASURES

### 1. Backup Strategy
```bash
# Before migration
mysqldump -u root -p hr_system > backup_before_migration.sql

# After each phase
mysqldump -u root -p hr_system > backup_phase_X.sql
```

### 2. Rollback Plan

**If Phase 1 fails**:
```sql
DROP TABLE IF EXISTS roles, permissions, role_permissions, 
  departments, designations, leave_types, leave_balances, 
  leave_approvals, employee_documents, attendance_summary,
  password_resets, email_verifications, holidays;
```

**If Phase 3 fails**:
```bash
# Restore from backup
mysql -u root -p hr_system < backup_before_migration.sql
```

**If Phase 4 fails**:
```bash
# Git revert
git checkout prisma/schema_backup.prisma prisma/schema.prisma
npx prisma generate
git checkout src/controllers/
```

### 3. Testing Checklist
- [ ] All existing APIs still work
- [ ] No data loss
- [ ] Foreign keys intact
- [ ] Indexes working
- [ ] Performance not degraded

---

## 📊 MIGRATION TIMELINE

| Phase | Task | Duration | Risk | Can Rollback? |
|-------|------|----------|------|---------------|
| 1 | Create new tables | 30 min | ZERO | ✅ Yes |
| 2 | Seed default data | 15 min | ZERO | ✅ Yes |
| 3 | Migrate existing data | 1-2 hrs | MEDIUM | ✅ Yes (backup) |
| 4 | Update code | 2-3 hrs | MEDIUM | ✅ Yes (git) |
| 5 | Testing | 2-3 hrs | LOW | N/A |
| 6 | Cleanup | 30 min | LOW | ✅ Yes |
| **TOTAL** | | **6-9 hrs** | | |

---

## ✅ POST-MIGRATION VERIFICATION

### 1. Data Integrity Checks
```sql
-- Check all users have roles
SELECT COUNT(*) FROM users WHERE roleId IS NULL;
-- Should be 0

-- Check all employees have departments
SELECT COUNT(*) FROM employees WHERE departmentId IS NULL;
-- Should match users without department

-- Check leave balances created
SELECT COUNT(*) FROM leave_balances;
-- Should be: (active employees) × (leave types)

-- Check foreign keys
SELECT 
  TABLE_NAME, 
  CONSTRAINT_NAME, 
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hr_system'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 2. API Testing
```bash
# Test all endpoints
npm run test

# Manual testing
curl http://localhost:5000/api/users
curl http://localhost:5000/api/departments
curl http://localhost:5000/api/leave-types
```

### 3. Performance Testing
```sql
-- Check query performance
EXPLAIN SELECT * FROM users u
INNER JOIN roles r ON u.roleId = r.id
INNER JOIN employees e ON u.id = e.userId
INNER JOIN departments d ON e.departmentId = d.id;
```

---

## 🎯 SUCCESS CRITERIA

✅ All existing features work  
✅ No data loss  
✅ All foreign keys intact  
✅ All indexes working  
✅ API response times < 200ms  
✅ All tests passing  
✅ Zero downtime (if using blue-green deployment)  

---

## 📞 SUPPORT

If migration fails:
1. Check error logs
2. Restore from backup
3. Review migration scripts
4. Test in staging first
5. Contact DBA if needed

