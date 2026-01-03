export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const formatAttendanceForExport = (attendance) => {
  return attendance.map(a => ({
    Date: new Date(a.date).toLocaleDateString(),
    Status: a.status,
    'Check In': a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '-',
    'Check Out': a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-',
    'Total Hours': a.totalHours || '-'
  }));
};

export const formatLeavesForExport = (leaves) => {
  return leaves.map(l => ({
    Type: l.type,
    'Start Date': new Date(l.startDate).toLocaleDateString(),
    'End Date': new Date(l.endDate).toLocaleDateString(),
    Status: l.status,
    Reason: l.reason,
    'Applied On': new Date(l.createdAt).toLocaleDateString()
  }));
};
