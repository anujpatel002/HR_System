const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllPayrollTransactions() {
  try {
    console.log('Starting deletion of all payroll transactions...');

    // Count existing payroll records
    const payrollCount = await prisma.payroll.count();
    console.log(`Found ${payrollCount} payroll records to delete`);

    if (payrollCount === 0) {
      console.log('No payroll records found.');
      return;
    }

    // Delete all payroll records
    const deleteResult = await prisma.payroll.deleteMany({});

    console.log(`Successfully deleted ${deleteResult.count} payroll records`);
    console.log('All payroll transactions have been deleted!');

  } catch (error) {
    console.error('Error during payroll deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllPayrollTransactions();