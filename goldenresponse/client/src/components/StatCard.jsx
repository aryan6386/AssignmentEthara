const StatCard = ({ icon: Icon, title, value, gradient = 'gradient-indigo', subtitle, trend }) => {
  return (
    <div
      className={`${gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            {Icon && <Icon className="w-6 h-6 text-white" />}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend > 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
        <p className="text-white text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-white/60 text-xs mt-2">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
