const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Running Phase 1: Creating tables...');
  const phase1 = fs.readFileSync(path.join(__dirname, 'migrations/phase1_create_tables.sql'), 'utf8');
  const statements1 = phase1.split(';').filter(s => s.trim());
  for (const stmt of statements1) {
    if (stmt.trim()) await connection.query(stmt);
  }
  console.log('✅ Phase 1 complete');
  
  console.log('Running Phase 2: Seeding data...');
  const phase2 = fs.readFileSync(path.join(__dirname, 'migrations/phase2_seed_data.sql'), 'utf8');
  const statements2 = phase2.split(';').filter(s => s.trim());
  for (const stmt of statements2) {
    if (stmt.trim()) await connection.query(stmt);
  }
  console.log('✅ Phase 2 complete');
  
  await connection.end();
  console.log('✅ All migrations complete!');
}

runMigrations().catch(console.error);
