import { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InlineSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white">Retry</button>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Students', value: stats?.totalStudents || stats?.students || 0, icon: HiOutlineAcademicCap, gradient: 'gradient-indigo' },
    { title: 'Total Teachers', value: stats?.totalTeachers || stats?.teachers || 0, icon: HiOutlineUserGroup, gradient: 'gradient-violet' },
    { title: 'Total Classes', value: stats?.totalClasses || stats?.classes || 0, icon: HiOutlineOfficeBuilding, gradient: 'gradient-emerald' },
    { title: 'Total Subjects', value: stats?.totalSubjects || stats?.subjects || 0, icon: HiOutlineBookOpen, gradient: 'gradient-sky' },
    { title: 'Departments', value: stats?.totalDepartments || stats?.departments || 0, icon: HiOutlineClipboardList, gradient: 'gradient-amber' },
    { title: 'Low Attendance', value: stats?.lowAttendanceCount || stats?.lowAttendance || 0, icon: HiOutlineExclamationCircle, gradient: 'gradient-rose' },
  ];

  const chartData = stats?.attendanceOverview || stats?.chartData || [
    { name: 'Mon', present: 85, absent: 15 },
    { name: 'Tue', present: 90, absent: 10 },
    { name: 'Wed', present: 78, absent: 22 },
    { name: 'Thu', present: 92, absent: 8 },
    { name: 'Fri', present: 88, absent: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of the attendance management system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart
          data={chartData}
          chartType="bar"
          xKey="name"
          title="Weekly Attendance Overview"
          yKeys={[
            { key: 'present', name: 'Present', color: '#22c55e' },
            { key: 'absent', name: 'Absent', color: '#ef4444' },
          ]}
        />
        <AttendanceChart
          data={chartData}
          chartType="line"
          xKey="name"
          title="Attendance Trend"
          yKeys={[
            { key: 'present', name: 'Present', color: '#6366f1' },
          ]}
        />
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dark/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {stats.recentActivity.slice(0, 10).map((activity, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">{new Date(activity.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{activity.class || activity.className || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{activity.subject || activity.subjectName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{activity.teacher || activity.teacherName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{activity.presentCount || activity.present || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
