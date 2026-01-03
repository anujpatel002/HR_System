const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllData() {
  console.log('🗑️ Clearing all data from database...');

  try {
    // Delete in correct order based on foreign key dependencies
    
    // Child tables first
    await prisma.activity_logs.deleteMany({});
    console.log('✅ Cleared activity_logs');
    
    await prisma.attendance.deleteMany({});
    console.log('✅ Cleared attendance');
    
    await prisma.employees.deleteMany({});
    console.log('✅ Cleared employees');
    
    await prisma.leaves.deleteMany({});
    console.log('✅ Cleared leaves');
    
    await prisma.payrolls.deleteMany({});
    console.log('✅ Cleared payrolls');
    
    await prisma.user_requests.deleteMany({});
    console.log('✅ Cleared user_requests');
    
    await prisma.user_sessions.deleteMany({});
    console.log('✅ Cleared user_sessions');
    
    await prisma.password_resets.deleteMany({});
    console.log('✅ Cleared password_resets');
    
    // Parent tables
    await prisma.users.deleteMany({});
    console.log('✅ Cleared users');
    
    await prisma.companies.deleteMany({});
    console.log('✅ Cleared companies');
    
    // Standalone tables
    await prisma.work_settings.deleteMany({});
    console.log('✅ Cleared work_settings');
    
    console.log('🎉 All data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();