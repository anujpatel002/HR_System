export default function StatsCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-accent-green',
    yellow: 'bg-yellow-50 text-accent-yellow',
    red: 'bg-red-50 text-accent-red',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card hover:shadow-google-lg transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}