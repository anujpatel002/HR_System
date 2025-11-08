const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupPayrollWithoutBankDetails() {
  try {
    console.log('Starting payroll cleanup for users without bank details...');

    // Find users without bank details
    const usersWithoutBankDetails = await prisma.user.findMany({
      where: {
        OR: [
          { accountNumber: null },
          { ifscCode: null },
          { accountNumber: '' },
          { ifscCode: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountNumber: true,
        ifscCode: true
      }
    });

    console.log(`Found ${usersWithoutBankDetails.length} users without complete bank details`);

    if (usersWithoutBankDetails.length === 0) {
      console.log('No users found without bank details. Nothing to clean up.');
      return;
    }

    // Get user IDs
    const userIds = usersWithoutBankDetails.map(user => user.id);

    // Count payroll records to be deleted
    const payrollCount = await prisma.payroll.count({
      where: {
        userId: { in: userIds }
      }
    });

    console.log(`Found ${payrollCount} payroll records to delete`);

    if (payrollCount === 0) {
      console.log('No payroll records found for users without bank details.');
      return;
    }

    // Delete payroll records
    const deleteResult = await prisma.payroll.deleteMany({
      where: {
        userId: { in: userIds }
      }
    });

    console.log(`Successfully deleted ${deleteResult.count} payroll records`);

    // Log affected users
    console.log('\nAffected users:');
    usersWithoutBankDetails.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Account: ${user.accountNumber || 'Missing'}, IFSC: ${user.ifscCode || 'Missing'}`);
    });

    console.log('\nPayroll cleanup completed successfully!');

  } catch (error) {
    console.error('Error during payroll cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPayrollWithoutBankDetails();