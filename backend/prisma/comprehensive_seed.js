const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateEmployeeId } = require('../src/utils/employeeIdGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive test data...');

  // Create companies first
  const companies = [
    { name: 'DayFlow Technologies', email: 'contact@dayflow.com', phone: '+1-555-0100', address: '123 Tech Street, Silicon Valley, CA', website: 'https://dayflow.com', industry: 'Technology', size: '50-100' },
    { name: 'InnovateCorp', email: 'info@innovatecorp.com', phone: '+1-555-0200', address: '456 Innovation Ave, Austin, TX', website: 'https://innovatecorp.com', industry: 'Consulting', size: '100-500' },
    { name: 'TechStart Inc', email: 'hello@techstart.com', phone: '+1-555-0300', address: '789 Startup Blvd, Seattle, WA', website: 'https://techstart.com', industry: 'Software', size: '10-50' }
  ];

  const createdCompanies = [];
  for (const company of companies) {
    const created = await prisma.companies.upsert({
      where: { name: company.name },
      update: {},
      create: company
    });
    createdCompanies.push(created);
  }

  // Create admin users for each company
  const adminUsers = [
    { email: 'admin@dayflow.com', name: 'Sarah Johnson', company: 'DayFlow Technologies', department: 'IT', designation: 'CEO' },
    { email: 'admin@innovatecorp.com', name: 'Michael Chen', company: 'InnovateCorp', department: 'Management', designation: 'Managing Director' },
    { email: 'admin@techstart.com', name: 'Emily Rodriguez', company: 'TechStart Inc', department: 'Leadership', designation: 'Founder & CEO' }
  ];

  const createdAdmins = [];
  for (const admin of adminUsers) {
    const password = await bcrypt.hash('admin123', 12);
    const created = await prisma.users.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        ...admin,
        password,
        role: 'ADMIN',
        basicSalary: 150000,
        employeeId: await generateEmployeeId(admin.name),
        dateOfJoining: new Date('2023-01-01'),
        mobile: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        address: '123 Executive Lane, ' + admin.company.split(' ')[0] + ' City',
        dateOfBirth: new Date('1985-05-15'),
        gender: admin.name.includes('Sarah') || admin.name.includes('Emily') ? 'Female' : 'Male',
        maritalStatus: 'Married',
        nationality: 'American'
      }
    });
    createdAdmins.push(created);
  }

  // Create HR Officers
  const hrOfficers = [
    { email: 'hr@dayflow.com', name: 'Jennifer Wilson', company: 'DayFlow Technologies', department: 'Human Resources' },
    { email: 'hr@innovatecorp.com', name: 'David Park', company: 'InnovateCorp', department: 'Human Resources' },
    { email: 'hr@techstart.com', name: 'Lisa Thompson', company: 'TechStart Inc', department: 'Human Resources' }
  ];

  const createdHRs = [];
  for (const hr of hrOfficers) {
    const password = await bcrypt.hash('hr123', 12);
    const created = await prisma.users.upsert({
      where: { email: hr.email },
      update: {},
      create: {
        ...hr,
        password,
        role: 'HR_OFFICER',
        designation: 'HR Manager',
        basicSalary: 85000,
        employeeId: await generateEmployeeId(hr.name),
        dateOfJoining: new Date('2023-02-01'),
        mobile: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        address: '456 HR Street, ' + hr.company.split(' ')[0] + ' City',
        dateOfBirth: new Date('1988-03-20'),
        gender: hr.name.includes('Jennifer') || hr.name.includes('Lisa') ? 'Female' : 'Male',
        maritalStatus: 'Single',
        nationality: 'American'
      }
    });
    createdHRs.push(created);
  }

  // Create Payroll Officers
  const payrollOfficers = [
    { email: 'payroll@dayflow.com', name: 'Robert Martinez', company: 'DayFlow Technologies', department: 'Finance' },
    { email: 'payroll@innovatecorp.com', name: 'Amanda Lee', company: 'InnovateCorp', department: 'Finance' },
    { email: 'payroll@techstart.com', name: 'James Brown', company: 'TechStart Inc', department: 'Finance' }
  ];

  const createdPayrolls = [];
  for (const payroll of payrollOfficers) {
    const password = await bcrypt.hash('payroll123', 12);
    const created = await prisma.users.upsert({
      where: { email: payroll.email },
      update: {},
      create: {
        ...payroll,
        password,
        role: 'PAYROLL_OFFICER',
        designation: 'Payroll Manager',
        basicSalary: 75000,
        employeeId: await generateEmployeeId(payroll.name),
        dateOfJoining: new Date('2023-02-15'),
        mobile: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        address: '789 Finance Ave, ' + payroll.company.split(' ')[0] + ' City',
        dateOfBirth: new Date('1990-07-10'),
        gender: payroll.name.includes('Amanda') ? 'Female' : 'Male',
        maritalStatus: 'Married',
        nationality: 'American',
        bankName: 'Chase Bank',
        accountNumber: '1234567890' + Math.floor(Math.random() * 100),
        ifscCode: 'CHAS0001234',
        panNo: 'ABCDE1234F',
        uanNo: '123456789012'
      }
    });
    createdPayrolls.push(created);
  }

  // Create Managers
  const managers = [
    { email: 'manager.eng@dayflow.com', name: 'Alex Thompson', company: 'DayFlow Technologies', department: 'Engineering' },
    { email: 'manager.sales@dayflow.com', name: 'Maria Garcia', company: 'DayFlow Technologies', department: 'Sales' },
    { email: 'manager.marketing@dayflow.com', name: 'Kevin Wang', company: 'DayFlow Technologies', department: 'Marketing' },
    { email: 'manager.ops@innovatecorp.com', name: 'Rachel Green', company: 'InnovateCorp', department: 'Operations' },
    { email: 'manager.dev@techstart.com', name: 'Tom Wilson', company: 'TechStart Inc', department: 'Development' }
  ];

  const createdManagers = [];
  for (const manager of managers) {
    const password = await bcrypt.hash('manager123', 12);
    const created = await prisma.users.upsert({
      where: { email: manager.email },
      update: {},
      create: {
        ...manager,
        password,
        role: 'MANAGER',
        designation: 'Department Manager',
        basicSalary: 95000,
        employeeId: await generateEmployeeId(manager.name),
        dateOfJoining: new Date('2023-03-01'),
        mobile: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        address: Math.floor(Math.random() * 999 + 100) + ' Manager St, ' + manager.company.split(' ')[0] + ' City',
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: ['Maria', 'Rachel'].includes(manager.name.split(' ')[0]) ? 'Female' : 'Male',
        maritalStatus: Math.random() > 0.5 ? 'Married' : 'Single',
        nationality: 'American'
      }
    });
    createdManagers.push(created);
  }

  // Create 50 Employees across different departments
  const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Development', 'Finance', 'Human Resources', 'IT', 'Customer Support', 'Quality Assurance'];
  const designations = {
    'Engineering': ['Software Engineer', 'Senior Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'],
    'Sales': ['Sales Representative', 'Account Manager', 'Sales Executive', 'Business Development', 'Sales Coordinator'],
    'Marketing': ['Marketing Specialist', 'Content Creator', 'Digital Marketer', 'Brand Manager', 'SEO Specialist'],
    'Operations': ['Operations Analyst', 'Process Manager', 'Operations Coordinator', 'Supply Chain Manager'],
    'Development': ['Full Stack Developer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager'],
    'Finance': ['Financial Analyst', 'Accountant', 'Budget Analyst', 'Tax Specialist'],
    'Human Resources': ['HR Coordinator', 'Recruiter', 'Training Specialist', 'Employee Relations'],
    'IT': ['System Administrator', 'Network Engineer', 'IT Support', 'Database Administrator'],
    'Customer Support': ['Support Representative', 'Technical Support', 'Customer Success Manager'],
    'Quality Assurance': ['QA Engineer', 'Test Analyst', 'Automation Tester', 'QA Lead']
  };

  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Ryan', 'Ashley', 'Daniel', 'Jessica', 'Matthew', 'Amanda', 'Andrew', 'Stephanie', 'Joshua', 'Melissa', 'Justin', 'Nicole', 'Brandon', 'Elizabeth', 'Tyler', 'Heather', 'Kevin', 'Michelle', 'Steven', 'Kimberly', 'Thomas', 'Amy', 'Timothy', 'Angela', 'Jason', 'Brenda', 'Jeffrey', 'Emma', 'Ryan', 'Olivia', 'Jacob', 'Sophia', 'Nicholas', 'Ava', 'Ethan', 'Isabella', 'Jonathan', 'Mia', 'Samuel', 'Charlotte', 'Anthony', 'Amelia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

  const createdEmployees = [];
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const department = departments[Math.floor(Math.random() * departments.length)];
    const designation = designations[department][Math.floor(Math.random() * designations[department].length)];
    const company = companies[Math.floor(Math.random() * companies.length)].name;
    
    // Find manager for this department and company
    const manager = createdManagers.find(m => m.department === department && m.company === company) || 
                   createdManagers.find(m => m.company === company) ||
                   createdAdmins.find(a => a.company === company);

    const password = await bcrypt.hash('employee123', 12);
    const employee = await prisma.users.create({
      data: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '').replace('technologies', 'tech').replace('corp', '').replace('inc', '')}.com`,
        name,
        password,
        role: 'EMPLOYEE',
        department,
        designation,
        company,
        basicSalary: 45000 + Math.floor(Math.random() * 40000), // 45k to 85k
        employeeId: await generateEmployeeId(name),
        manager: manager?.id,
        dateOfJoining: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        mobile: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        address: `${Math.floor(Math.random() * 999 + 100)} ${lastName} Street, ${company.split(' ')[0]} City`,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: ['Jane', 'Sarah', 'Lisa', 'Emma', 'Ashley', 'Jessica', 'Amanda', 'Stephanie', 'Melissa', 'Nicole', 'Elizabeth', 'Heather', 'Michelle', 'Kimberly', 'Amy', 'Angela', 'Brenda', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia'].includes(firstName) ? 'Female' : 'Male',
        maritalStatus: Math.random() > 0.6 ? 'Married' : 'Single',
        nationality: 'American',
        bankName: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank'][Math.floor(Math.random() * 5)],
        accountNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
        ifscCode: ['CHAS0001234', 'BOFA0001234', 'WELL0001234', 'CITI0001234', 'USBA0001234'][Math.floor(Math.random() * 5)],
        panNo: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        uanNo: Math.floor(Math.random() * 900000000000 + 100000000000).toString()
      }
    });
    createdEmployees.push(employee);
  }

  // Create attendance records for the last 90 days
  console.log('Creating attendance records...');
  const today = new Date();
  const allUsers = [...createdAdmins, ...createdHRs, ...createdPayrolls, ...createdManagers, ...createdEmployees];
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    for (const user of allUsers) {
      // 85% attendance rate
      if (Math.random() > 0.15) {
        const checkIn = new Date(date);
        checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        
        const totalHours = (checkOut - checkIn) / (1000 * 60 * 60);
        
        try {
          await prisma.attendance.create({
            data: {
              userId: user.id,
              date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              checkIn,
              checkOut,
              totalHours: Math.round(totalHours * 100) / 100,
              status: totalHours < 4 ? 'HALF_DAY' : 'PRESENT'
            }
          });
        } catch (error) {
          // Skip if already exists
        }
      }
    }
  }

  // Create leave applications
  console.log('Creating leave applications...');
  const leaveTypes = ['SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY'];
  const leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  
  for (let i = 0; i < 100; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const type = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
    
    try {
      await prisma.leaves.create({
        data: {
          userId: user.id,
          type,
          startDate,
          endDate,
          reason: `${type.toLowerCase()} leave request for personal reasons`,
          status: leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)]
        }
      });
    } catch (error) {
      // Skip if error
    }
  }

  // Create payroll records for the last 6 months
  console.log('Creating payroll records...');
  for (let month = 0; month < 6; month++) {
    const payrollDate = new Date(today);
    payrollDate.setMonth(payrollDate.getMonth() - month);
    const monthStr = String(payrollDate.getMonth() + 1).padStart(2, '0');
    const year = payrollDate.getFullYear();
    
    for (const user of allUsers) {
      if (user.basicSalary) {
        const gross = user.basicSalary;
        const pf = gross * 0.12; // 12% PF
        const tax = gross > 50000 ? gross * 0.1 : gross * 0.05; // Tax based on salary
        const deductions = pf + tax + Math.floor(Math.random() * 1000); // Random additional deductions
        const netPay = gross - deductions;
        
        try {
          await prisma.payrolls.create({
            data: {
              userId: user.id,
              month: monthStr,
              year,
              basicSalary: gross,
              gross,
              pf,
              tax,
              deductions,
              netPay
            }
          });
        } catch (error) {
          // Skip if already exists
        }
      }
    }
  }

  // Create user sessions
  console.log('Creating user sessions...');
  for (let i = 0; i < 200; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const loginTime = new Date(today);
    loginTime.setDate(loginTime.getDate() - Math.floor(Math.random() * 30));
    loginTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const logoutTime = Math.random() > 0.3 ? new Date(loginTime.getTime() + Math.random() * 8 * 60 * 60 * 1000) : null;
    
    try {
      await prisma.user_sessions.create({
        data: {
          userId: user.id,
          isActive: !logoutTime,
          loginTime,
          logoutTime,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          lastActivity: logoutTime || new Date()
        }
      });
    } catch (error) {
      // Skip if error
    }
  }

  // Create activity logs
  console.log('Creating activity logs...');
  const activities = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'];
  const targetTypes = ['USER', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'PROFILE'];
  
  for (let i = 0; i < 500; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const action = activities[Math.floor(Math.random() * activities.length)];
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    const createdAt = new Date(today);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    
    try {
      await prisma.activity_logs.create({
        data: {
          userId: user.id,
          action,
          targetType,
          targetId: `target-${Math.floor(Math.random() * 1000)}`,
          details: { action, timestamp: createdAt.toISOString() },
          createdAt
        }
      });
    } catch (error) {
      // Skip if error
    }
  }

  // Create work settings
  await prisma.work_settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      workStartTime: '09:00',
      workEndTime: '17:00',
      workingDays: '1,2,3,4,5', // Monday to Friday
      lunchBreakStart: '12:00',
      lunchBreakEnd: '13:00',
      checkInPopup: true,
      popupStartTime: '08:45',
      popupEndTime: '09:15'
    }
  });

  console.log('✅ Database seeded successfully with comprehensive test data!');
  console.log('📊 Created:');
  console.log(`   - ${createdCompanies.length} Companies`);
  console.log(`   - ${createdAdmins.length} Admin users`);
  console.log(`   - ${createdHRs.length} HR Officers`);
  console.log(`   - ${createdPayrolls.length} Payroll Officers`);
  console.log(`   - ${createdManagers.length} Managers`);
  console.log(`   - ${createdEmployees.length} Employees`);
  console.log('   - 90 days of attendance records');
  console.log('   - 100 leave applications');
  console.log('   - 6 months of payroll records');
  console.log('   - 200 user sessions');
  console.log('   - 500 activity logs');
  console.log('   - Work settings configuration');
  
  console.log('\n📧 Sample Login Accounts:');
  console.log('   Admin: admin@dayflow.com / admin123');
  console.log('   HR: hr@dayflow.com / hr123');
  console.log('   Payroll: payroll@dayflow.com / payroll123');
  console.log('   Manager: manager.eng@dayflow.com / manager123');
  console.log('   Employee: (any generated employee email) / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });