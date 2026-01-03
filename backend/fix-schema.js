const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSchema() {
  try {
    // Check if companies table exists
    const tables = await prisma.$queryRaw`SHOW TABLES LIKE 'companies'`;
    console.log('Companies table exists:', tables.length > 0);
    
    // Check if companyId column exists in users
    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM users LIKE 'companyId'`;
    console.log('companyId column exists:', columns.length > 0);
    
    if (tables.length === 0) {
      console.log('Creating companies table...');
      await prisma.$executeRaw`
        CREATE TABLE companies (
          id VARCHAR(191) PRIMARY KEY,
          name VARCHAR(191) UNIQUE NOT NULL,
          email VARCHAR(191),
          phone VARCHAR(191),
          address TEXT,
          website VARCHAR(191),
          industry VARCHAR(191),
          size VARCHAR(191),
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        )
      `;
    }
    
    if (columns.length === 0) {
      console.log('Adding companyId column to users...');
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN companyId VARCHAR(191)`;
      await prisma.$executeRaw`CREATE INDEX users_companyId_idx ON users(companyId)`;
    }
    
    // Migrate existing company data
    const usersWithCompany = await prisma.$queryRaw`SELECT DISTINCT company FROM users WHERE company IS NOT NULL`;
    console.log('Found companies:', usersWithCompany.length);
    
    for (const user of usersWithCompany) {
      const companyId = require('crypto').randomUUID();
      await prisma.$executeRaw`INSERT IGNORE INTO companies (id, name, createdAt, updatedAt) VALUES (${companyId}, ${user.company}, NOW(3), NOW(3))`;
      const company = await prisma.$queryRaw`SELECT id FROM companies WHERE name = ${user.company}`;
      if (company.length > 0) {
        await prisma.$executeRaw`UPDATE users SET companyId = ${company[0].id} WHERE company = ${user.company}`;
      }
    }
    
    console.log('Schema fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchema();
