import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineOfficeBuilding,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineDocumentReport,
  HiOutlineCalendar,
  HiX,
} from 'react-icons/hi';

const menuItems = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/admin/students', label: 'Students', icon: HiOutlineAcademicCap },
    { path: '/admin/teachers', label: 'Teachers', icon: HiOutlineUserGroup },
    { path: '/admin/subjects', label: 'Subjects', icon: HiOutlineBookOpen },
    { path: '/admin/classes', label: 'Classes', icon: HiOutlineOfficeBuilding },
    { path: '/admin/departments', label: 'Departments', icon: HiOutlineClipboardList },
    { path: '/admin/reports', label: 'Reports', icon: HiOutlineChartBar },
    { path: '/admin/low-attendance', label: 'Low Attendance', icon: HiOutlineExclamationCircle },
  ],
  teacher: [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/teacher/mark-attendance', label: 'Mark Attendance', icon: HiOutlineClipboardCheck },
    { path: '/teacher/attendance-history', label: 'Attendance History', icon: HiOutlineClock },
    { path: '/teacher/reports', label: 'Reports', icon: HiOutlineChartBar },
    { path: '/teacher/profile', label: 'Profile', icon: HiOutlineUser },
  ],
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/student/attendance', label: 'My Attendance', icon: HiOutlineCalendar },
    { path: '/student/reports', label: 'Reports', icon: HiOutlineDocumentReport },
    { path: '/student/profile', label: 'Profile', icon: HiOutlineUser },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const location = useLocation();
  const items = menuItems[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-surface border-r border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-lg shadow-primary/20">
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">AttendEase</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Attendance System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Navigation
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50">
          <p className="text-[11px] text-slate-600 text-center">
            © 2024 AttendEase
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
