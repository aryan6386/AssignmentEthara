import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import {
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/teacher/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InlineSpinner />;

  const statCards = [
    { title: 'Assigned Classes', value: stats?.totalClasses || stats?.classes?.length || 0, icon: HiOutlineOfficeBuilding, gradient: 'gradient-indigo' },
    { title: 'Subjects', value: stats?.totalSubjects || stats?.subjects?.length || 0, icon: HiOutlineBookOpen, gradient: 'gradient-violet' },
    { title: 'Total Sessions', value: stats?.totalSessions || 0, icon: HiOutlineClipboardCheck, gradient: 'gradient-emerald' },
    { title: 'Low Attendance Alerts', value: stats?.lowAttendanceCount || 0, icon: HiOutlineExclamationCircle, gradient: 'gradient-rose' },
  ];

  const chartData = stats?.classWiseAttendance || stats?.attendanceData || [
    { name: 'CS-A', present: 85, absent: 15 },
    { name: 'CS-B', present: 78, absent: 22 },
    { name: 'IT-A', present: 92, absent: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teacher Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your classes and attendance</p>
        </div>
        <button
          onClick={() => navigate('/teacher/mark-attendance')}
          className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <HiOutlineClipboardCheck className="w-5 h-5" /> Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart
          data={chartData}
          chartType="bar"
          xKey="name"
          title="Class-wise Attendance"
          yKeys={[
            { key: 'present', name: 'Present', color: '#22c55e' },
            { key: 'absent', name: 'Absent', color: '#ef4444' },
          ]}
        />
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Low Attendance Alerts</h3>
          <div className="space-y-3">
            {(stats?.lowAttendanceStudents || []).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No alerts at this time</p>
            ) : (
              (stats?.lowAttendanceStudents || []).slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-dark rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-amber flex items-center justify-center text-white text-xs font-bold">
                      {(s.name || s.studentName || 'S').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{s.name || s.studentName}</p>
                      <p className="text-xs text-slate-500">{s.subject || s.className || ''}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${(s.percentage || s.attendancePercentage || 0) < 50 ? 'text-red-400' : 'text-amber-400'}`}>
                    {(s.percentage || s.attendancePercentage || 0).toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
