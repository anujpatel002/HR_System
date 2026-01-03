const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Creating companies table...');
    
    await connection.query(`
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
      )
    `);
    
    console.log('Adding companyId column to users...');
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS companyId VARCHAR(191)`);
    
    console.log('Migrating existing company data...');
    await connection.query(`
      INSERT IGNORE INTO companies (id, name, createdAt, updatedAt)
      SELECT 
        UUID() as id,
        company as name,
        NOW() as createdAt,
        NOW() as updatedAt
      FROM users 
      WHERE company IS NOT NULL 
      GROUP BY company
    `);
    
    console.log('Linking users to companies...');
    await connection.query(`
      UPDATE users u
      INNER JOIN companies c ON BINARY u.company = BINARY c.name
      SET u.companyId = c.id
      WHERE u.company IS NOT NULL
    `);
    
    console.log('Adding foreign key constraint...');
    await connection.query(`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_company 
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    `).catch(() => console.log('Foreign key already exists'));
    
    console.log('Creating index...');
    await connection.query(`CREATE INDEX idx_users_companyId ON users(companyId)`).catch(() => console.log('Index already exists'));
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
