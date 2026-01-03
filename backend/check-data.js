const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const users = await prisma.users.findMany({ select: { id: true, name: true, email: true, company: true, companyId: true } });
    console.log('Users:', users);
    
    const companies = await prisma.companies.findMany();
    console.log('\nCompanies:', companies);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
