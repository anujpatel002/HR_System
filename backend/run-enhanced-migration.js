const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runEnhancedMigrations() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Creating enhanced tables with foreign keys...\n');
  const createSQL = fs.readFileSync('./migrations/create_enhanced_tables.sql', 'utf8');
  const statements = createSQL.split(';').filter(s => s.trim() && !s.includes('SELECT'));
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      await connection.query(stmt);
      const match = stmt.match(/CREATE TABLE (\w+)/);
      if (match) console.log(`✓ Created ${match[1]}`);
    }
  }
  
  console.log('\n✅ All tables created with foreign keys!\n');
  
  console.log('Seeding default data...\n');
  const seedSQL = fs.readFileSync('./migrations/seed_default_data.sql', 'utf8');
  const seedStatements = seedSQL.split(';').filter(s => s.trim() && !s.includes('SELECT'));
  
  for (const stmt of seedStatements) {
    if (stmt.trim()) await connection.query(stmt);
  }
  
  console.log('✅ Default data seeded!\n');
  
  // Verify
  const [roles] = await connection.query('SELECT COUNT(*) as count FROM roles');
  const [leaveTypes] = await connection.query('SELECT COUNT(*) as count FROM leave_types');
  const [departments] = await connection.query('SELECT COUNT(*) as count FROM departments');
  
  console.log('Verification:');
  console.log(`  Roles: ${roles[0].count}`);
  console.log(`  Leave Types: ${leaveTypes[0].count}`);
  console.log(`  Departments: ${departments[0].count}`);
  
  await connection.end();
  console.log('\n✅ Migration complete!');
}

runEnhancedMigrations().catch(console.error);
