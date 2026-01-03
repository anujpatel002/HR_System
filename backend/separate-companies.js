const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function separateCompanies() {
  try {
    // Get all users
    const users = await prisma.users.findMany({ select: { id: true, email: true, companyId: true } });
    
    // Find the polycab company user
    const polycabUser = users.find(u => u.email === 'anujvelani666@gmail.com');
    
    if (!polycabUser || !polycabUser.companyId) {
      console.log('Polycab user not found or has no company');
      return;
    }
    
    // Reset all other users to null companyId
    await prisma.users.updateMany({
      where: { 
        id: { not: polycabUser.id }
      },
      data: { companyId: null }
    });
    
    console.log('Company separation complete!');
    console.log('Polycab company user:', polycabUser.email);
    console.log('All other users reset to no company');
    
    const counts = await prisma.users.groupBy({
      by: ['companyId'],
      _count: true
    });
    console.log('\nUsers per company:', counts);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

separateCompanies();
