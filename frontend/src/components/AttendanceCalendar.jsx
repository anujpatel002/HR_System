'use client';

import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendanceCalendar({ attendance, month, year }) {
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getAttendanceForDay = (day) => {
    const date = new Date(year, month - 1, day);
    return attendance.find(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === day && aDate.getMonth() === month - 1 && aDate.getFullYear() === year;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 border-green-500';
      case 'ABSENT': return 'bg-red-100 border-red-500';
      case 'HALF_DAY': return 'bg-yellow-100 border-yellow-500';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ABSENT': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'HALF_DAY': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => {
          const record = getAttendanceForDay(day);
          const isToday = new Date().getDate() === day && 
                         new Date().getMonth() === month - 1 && 
                         new Date().getFullYear() === year;
          
          return (
            <div
              key={day}
              className={`aspect-square border-2 rounded-lg p-2 flex flex-col items-center justify-center ${
                record ? getStatusColor(record.status) : 'bg-gray-50 border-gray-200'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="text-sm font-medium text-gray-900">{day}</div>
              {record && (
                <div className="mt-1">
                  {getStatusIcon(record.status)}
                </div>
              )}
              {record && record.totalHours && (
                <div className="text-xs text-gray-600 mt-1">{record.totalHours}h</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-gray-600">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-gray-600">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-gray-600">Half Day</span>
        </div>
      </div>
    </div>
  );
}
