const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetMigrations() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Dropping existing new tables...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'leave_approvals', 'leave_balances', 'employee_documents',
    'role_permissions', 'password_resets', 'holidays',
    'leave_types', 'permissions', 'roles', 'departments', 'designations'
  ];
  
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`✓ Dropped ${table}`);
  }
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('\n✅ All new tables dropped\n');
  
  console.log('Running Phase 1: Creating tables...');
  const fs = require('fs');
  const phase1 = fs.readFileSync('./migrations/phase1_create_tables.sql', 'utf8');
  const statements1 = phase1.split(';').filter(s => s.trim() && !s.includes('SELECT'));
  for (const stmt of statements1) {
    if (stmt.trim()) await connection.query(stmt);
  }
  console.log('✅ Phase 1 complete\n');
  
  console.log('Running Phase 2: Seeding data...');
  const phase2 = fs.readFileSync('./migrations/phase2_seed_data.sql', 'utf8');
  const statements2 = phase2.split(';').filter(s => s.trim() && !s.includes('SELECT'));
  for (const stmt of statements2) {
    if (stmt.trim()) await connection.query(stmt);
  }
  console.log('✅ Phase 2 complete\n');
  
  await connection.end();
  console.log('✅ All migrations complete!');
}

resetMigrations().catch(console.error);
