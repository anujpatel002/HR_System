import { User } from 'lucide-react';

export default function EmployeeCard({ employee, onSelect, isSelected }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-accent-green';
      case 'absent': return 'bg-accent-red';
      default: return 'bg-accent-yellow';
    }
  };

  return (
    <div 
      className={`relative card cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary-600 bg-primary-50' : 'hover:shadow-google-lg'
      }`}
      onClick={() => onSelect(employee)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(employee.status)}`}></div>
        </div>
        
        <h3 className="font-medium text-gray-900 text-sm mb-1">{employee.name}</h3>
        <p className="text-xs text-gray-600 mb-2">{employee.department}</p>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`}></div>
          <span className="text-xs text-gray-700 capitalize">{employee.status}</span>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}