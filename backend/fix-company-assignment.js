const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompanyAssignment() {
  try {
    // Get the company
    const company = await prisma.companies.findFirst();
    
    if (!company) {
      console.log('No company found. Creating default company...');
      const newCompany = await prisma.companies.create({
        data: {
          id: require('crypto').randomUUID(),
          name: 'WorkZen',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      await prisma.users.updateMany({
        where: { companyId: null },
        data: { companyId: newCompany.id, company: 'WorkZen' }
      });
      console.log('All users assigned to WorkZen company');
    } else {
      // Assign all users without companyId to the existing company
      await prisma.users.updateMany({
        where: { companyId: null },
        data: { companyId: company.id, company: company.name }
      });
      console.log(`All users assigned to ${company.name} company`);
    }
    
    const updated = await prisma.users.count({ where: { companyId: { not: null } } });
    console.log(`Total users with company: ${updated}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyAssignment();
