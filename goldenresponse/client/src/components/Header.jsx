import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMenuAlt2, HiOutlineLogout, HiOutlineBell } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'teacher': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'student': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <HiOutlineMenuAlt2 className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-slate-300">
            Welcome back,{' '}
            <span className="text-slate-100 font-semibold">{user?.name || 'User'}</span>
          </h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getRoleBadgeColor(user?.role)}`}>
          {user?.role}
        </span>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
