const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateEmployeeId } = require('../src/utils/employeeIdGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@workzen.com' },
    update: {},
    create: {
      email: 'admin@workzen.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
      designation: 'System Admin',
      basicSalary: 100000,
      employeeId: await generateEmployeeId('System Administrator')
    }
  });

  // Create HR Officer
  const hrPassword = await bcrypt.hash('hr123', 12);
  const hrOfficer = await prisma.users.upsert({
    where: { email: 'hr@workzen.com' },
    update: {},
    create: {
      email: 'hr@workzen.com',
      name: 'HR Manager',
      password: hrPassword,
      role: 'HR_OFFICER',
      department: 'Human Resources',
      designation: 'HR Manager',
      basicSalary: 80000,
      employeeId: await generateEmployeeId('HR Manager')
    }
  });

  // Create Payroll Officer
  const payrollPassword = await bcrypt.hash('payroll123', 12);
  const payrollOfficer = await prisma.users.upsert({
    where: { email: 'payroll@workzen.com' },
    update: {},
    create: {
      email: 'payroll@workzen.com',
      name: 'Payroll Manager',
      password: payrollPassword,
      role: 'PAYROLL_OFFICER',
      department: 'Finance',
      designation: 'Payroll Manager',
      basicSalary: 75000,
      employeeId: await generateEmployeeId('Payroll Manager')
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
    await prisma.users.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        password: employeePassword,
        role: 'EMPLOYEE',
        employeeId: await generateEmployeeId(emp.name)
      }
    });
  }

  // Get created users for sample data
  const johnDoe = await prisma.users.findUnique({ where: { email: 'john.doe@workzen.com' } });
  const janeSmith = await prisma.users.findUnique({ where: { email: 'jane.smith@workzen.com' } });

  // Create sample attendance records for the last 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // 90% attendance rate
    if (Math.random() > 0.1) {
      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      
      const checkOut = new Date(date);
      checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      
      const totalHours = (checkOut - checkIn) / (1000 * 60 * 60);
      
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: johnDoe.id,
            date: date
          }
        },
        update: {},
        create: {
          userId: johnDoe.id,
          date: date,
          checkIn: checkIn,
          checkOut: checkOut,
          totalHours: Math.round(totalHours * 100) / 100,
          status: 'PRESENT'
        }
      });
    }
  }

  // Create sample leave applications
  const leaveApplications = [
    {
      userId: johnDoe.id,
      type: 'CASUAL',
      startDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 16),
      reason: 'Personal work',
      status: 'PENDING'
    },
    {
      userId: johnDoe.id,
      type: 'SICK',
      startDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
      endDate: new Date(today.getFullYear(), today.getMonth() - 1, 12),
      reason: 'Fever and cold',
      status: 'APPROVED'
    }
  ];

  for (const leave of leaveApplications) {
    await prisma.leaves.create({ data: leave });
  }

  // Create sample payroll records
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const lastMonth = String(today.getMonth()).padStart(2, '0');
  const currentYear = today.getFullYear();
  
  const payrollData = [
    {
      userId: johnDoe.id,
      month: lastMonth,
      year: currentYear,
      basicSalary: 60000,
      gross: 60000,
      pf: 7200, // 12% of basic
      tax: 200,
      deductions: 7400,
      netPay: 52600
    },
    {
      userId: johnDoe.id,
      month: String(today.getMonth() - 1).padStart(2, '0'),
      year: currentYear,
      basicSalary: 60000,
      gross: 60000,
      pf: 7200,
      tax: 200,
      deductions: 7900,
      netPay: 52100
    }
  ];

  for (const payroll of payrollData) {
    await prisma.payrolls.create({ data: payroll });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Default accounts:');
  console.log('   Admin: admin@workzen.com / admin123');
  console.log('   HR: hr@workzen.com / hr123');
  console.log('   Payroll: payroll@workzen.com / payroll123');
  console.log('   Employee: john.doe@workzen.com / employee123');
  console.log('📊 Sample data created:');
  console.log('   - 30 days of attendance records');
  console.log('   - 2 leave applications');
  console.log('   - 2 payroll records');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });