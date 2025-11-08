const calculatePayroll = (basicSalary, unpaidLeaveDays = 0) => {
  const gross = basicSalary;
  const pf = Math.round(basicSalary * 0.12);
  const tax = 200;
  const unpaidLeaveDeduction = Math.round((gross / 30) * unpaidLeaveDays);
  const totalDeductions = pf + tax + unpaidLeaveDeduction;
  const netPay = gross - totalDeductions;

  return {
    gross,
    pf,
    tax,
    deductions: totalDeductions,
    netPay: Math.max(0, netPay)
  };
};

const getWorkingDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
      workingDays++;
    }
  }
  
  return workingDays;
};

module.exports = { calculatePayroll, getWorkingDaysInMonth };