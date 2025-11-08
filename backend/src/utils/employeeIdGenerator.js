const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateEmployeeId(name) {
  const currentYear = new Date().getFullYear();
  
  // Extract first two letters of first and last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';
  
  const firstTwoLetters = firstName.substring(0, 2).toUpperCase();
  const lastTwoLetters = lastName.substring(0, 2).toUpperCase();
  
  // Get count of all users created in current year for serial number
  const userCount = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(`${currentYear}-01-01`),
        lt: new Date(`${currentYear + 1}-01-01`)
      }
    }
  });
  
  // Generate serial number (next user number)
  const serialNumber = String(userCount + 1).padStart(4, '0');
  
  // Format: OI + FirstTwoLetters + LastTwoLetters + Year + SerialNumber
  const employeeId = `OI${firstTwoLetters}${lastTwoLetters}${currentYear}${serialNumber}`;
  
  return employeeId;
}

module.exports = { generateEmployeeId };