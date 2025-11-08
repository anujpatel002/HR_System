import { User } from 'lucide-react';

export default function EmployeeCard({ employee, onSelect, isSelected }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(employee)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(employee.status)}`}></div>
        </div>
        
        <h3 className="font-medium text-gray-900 text-sm mb-1">{employee.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{employee.department}</p>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`}></div>
          <span className="text-xs text-gray-600 capitalize">{employee.status}</span>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}