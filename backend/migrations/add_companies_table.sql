-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add companyId column to users table
ALTER TABLE users ADD COLUMN companyId VARCHAR(191);

-- Migrate existing company data to companies table and link users
-- This will create a company for each unique company name in users table
INSERT INTO companies (id, name, createdAt, updatedAt)
SELECT 
  UUID() as id,
  company as name,
  NOW() as createdAt,
  NOW() as updatedAt
FROM users 
WHERE company IS NOT NULL 
GROUP BY company;

-- Update users with companyId
UPDATE users u
INNER JOIN companies c ON u.company = c.name
SET u.companyId = c.id
WHERE u.company IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_company 
FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_users_companyId ON users(companyId);
