-- ============================================
-- PHASE 2: SEED DEFAULT DATA
-- Duration: 15 minutes | Risk: ZERO
-- ============================================

USE hr_system;

-- 1. SEED ROLES
INSERT INTO roles (id, name, description) VALUES
('role-admin', 'ADMIN', 'Full system access'),
('role-hr', 'HR_OFFICER', 'HR management'),
('role-payroll', 'PAYROLL_OFFICER', 'Payroll management'),
('role-manager', 'MANAGER', 'Team management'),
('role-employee', 'EMPLOYEE', 'Basic access');

-- 2. SEED PERMISSIONS
INSERT INTO permissions (id, module, action) VALUES
(UUID(), 'users', 'create'),
(UUID(), 'users', 'read'),
(UUID(), 'users', 'update'),
(UUID(), 'users', 'delete'),
(UUID(), 'attendance', 'mark'),
(UUID(), 'attendance', 'view_own'),
(UUID(), 'attendance', 'view_all'),
(UUID(), 'leaves', 'apply'),
(UUID(), 'leaves', 'approve'),
(UUID(), 'leaves', 'view_own'),
(UUID(), 'leaves', 'view_all'),
(UUID(), 'payroll', 'generate'),
(UUID(), 'payroll', 'view_own'),
(UUID(), 'payroll', 'view_all');

-- 3. SEED LEAVE TYPES
INSERT INTO leave_types (id, name, code, defaultBalance, isPaid) VALUES
(UUID(), 'Sick Leave', 'SICK', 12, TRUE),
(UUID(), 'Casual Leave', 'CASUAL', 12, TRUE),
(UUID(), 'Annual Leave', 'ANNUAL', 20, TRUE),
(UUID(), 'Maternity Leave', 'MATERNITY', 180, TRUE),
(UUID(), 'Paternity Leave', 'PATERNITY', 15, TRUE);

-- 4. SEED DEPARTMENTS
INSERT INTO departments (id, name, code) VALUES
(UUID(), 'Information Technology', 'IT'),
(UUID(), 'Human Resources', 'HR'),
(UUID(), 'Finance', 'FIN'),
(UUID(), 'Marketing', 'MKT'),
(UUID(), 'Operations', 'OPS'),
(UUID(), 'Sales', 'SALES');

-- 5. SEED DESIGNATIONS
INSERT INTO designations (id, title, level) VALUES
(UUID(), 'Intern', 1),
(UUID(), 'Junior Developer', 2),
(UUID(), 'Developer', 3),
(UUID(), 'Senior Developer', 4),
(UUID(), 'Team Lead', 5),
(UUID(), 'Manager', 6),
(UUID(), 'Director', 7);

SELECT 'Phase 2 Complete: Default data seeded!' AS Status;
