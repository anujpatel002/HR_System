-- Delete all data from HR System tables in correct order
-- Based on foreign key dependencies

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete child tables first (tables with foreign keys)
DELETE FROM activity_logs;
DELETE FROM attendance;
DELETE FROM employees;
DELETE FROM leaves;
DELETE FROM payrolls;
DELETE FROM user_requests;
DELETE FROM user_sessions;
DELETE FROM password_resets;

-- Delete parent tables
DELETE FROM users;
DELETE FROM companies;

-- Delete standalone tables
DELETE FROM work_settings;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters (optional)
-- ALTER TABLE activity_logs AUTO_INCREMENT = 1;
-- ALTER TABLE attendance AUTO_INCREMENT = 1;
-- etc.