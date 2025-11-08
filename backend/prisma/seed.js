const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@workzen.com' },
    update: {},
    create: {
      email: 'admin@workzen.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
      designation: 'System Admin',
      basicSalary: 100000
    }
  });

  // Create HR Officer
  const hrPassword = await bcrypt.hash('hr123', 12);
  const hrOfficer = await prisma.user.upsert({
    where: { email: 'hr@workzen.com' },
    update: {},
    create: {
      email: 'hr@workzen.com',
      name: 'HR Manager',
      password: hrPassword,
      role: 'HR_OFFICER',
      department: 'Human Resources',
      designation: 'HR Manager',
      basicSalary: 80000
    }
  });

  // Create Payroll Officer
  const payrollPassword = await bcrypt.hash('payroll123', 12);
  const payrollOfficer = await prisma.user.upsert({
    where: { email: 'payroll@workzen.com' },
    update: {},
    create: {
      email: 'payroll@workzen.com',
      name: 'Payroll Manager',
      password: payrollPassword,
      role: 'PAYROLL_OFFICER',
      department: 'Finance',
      designation: 'Payroll Manager',
      basicSalary: 75000
    }
  });

  // Create sample employees
  const employeePassword = await bcrypt.hash('employee123', 12);
  
  const employees = [
    {
      email: 'john.doe@workzen.com',
      name: 'John Doe',
      department: 'Engineering',
      designation: 'Software Developer',
      basicSalary: 60000
    },
    {
      email: 'jane.smith@workzen.com',
      name: 'Jane Smith',
      department: 'Marketing',
      designation: 'Marketing Specialist',
      basicSalary: 55000
    },
    {
      email: 'mike.johnson@workzen.com',
      name: 'Mike Johnson',
      department: 'Sales',
      designation: 'Sales Executive',
      basicSalary: 50000
    }
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        password: employeePassword,
        role: 'EMPLOYEE'
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Default accounts:');
  console.log('   Admin: admin@workzen.com / admin123');
  console.log('   HR: hr@workzen.com / hr123');
  console.log('   Payroll: payroll@workzen.com / payroll123');
  console.log('   Employee: john.doe@workzen.com / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });