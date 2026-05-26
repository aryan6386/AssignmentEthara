import { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineChartBar,
} from 'react-icons/hi';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/student/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InlineSpinner />;

  const overallPercentage = stats?.overallAttendance || stats?.attendancePercentage || 0;
  const totalPresent = stats?.totalPresent || stats?.present || 0;
  const totalAbsent = stats?.totalAbsent || stats?.absent || 0;
  const totalLate = stats?.totalLate || stats?.late || 0;
  const totalClasses = stats?.totalClasses || (totalPresent + totalAbsent + totalLate) || 0;

  const statCards = [
    { title: 'Total Present', value: totalPresent, icon: HiOutlineCheckCircle, gradient: 'gradient-emerald' },
    { title: 'Total Absent', value: totalAbsent, icon: HiOutlineXCircle, gradient: 'gradient-rose' },
    { title: 'Total Late', value: totalLate, icon: HiOutlineClock, gradient: 'gradient-amber' },
    { title: 'Total Classes', value: totalClasses, icon: HiOutlineChartBar, gradient: 'gradient-indigo' },
  ];

  const subjectData = stats?.subjectWise || stats?.subjects || [];

  const monthlyData = stats?.monthlyAttendance || stats?.monthly || [
    { name: 'Jan', percentage: 85 },
    { name: 'Feb', percentage: 90 },
    { name: 'Mar', percentage: 78 },
    { name: 'Apr', percentage: 92 },
    { name: 'May', percentage: 88 },
  ];

  // Circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (overallPercentage / 100) * circumference;
  const progressColor = overallPercentage >= 75 ? '#22c55e' : overallPercentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Student Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your attendance overview at a glance</p>
      </div>

      {/* Top Section: Circular Progress + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Progress */}
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-8 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">Overall Attendance</h3>
          <div className="relative">
            <svg className="circular-progress w-44 h-44">
              <circle cx="88" cy="88" r={radius} fill="none" stroke="#334155" strokeWidth="8" />
              <circle
                cx="88" cy="88" r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: progressColor }}>
                {overallPercentage.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400">percent</span>
            </div>
          </div>
          {overallPercentage < 75 && (
            <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
              ⚠️ Your attendance is below 75%. Please attend more classes.
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjectData.length > 0 && (
          <AttendanceChart
            data={subjectData.map((s) => ({
              name: s.subjectName || s.subject?.name || s.name || 'Subject',
              percentage: s.percentage || s.attendancePercentage || 0,
              present: s.present || s.presentCount || 0,
              absent: s.absent || s.absentCount || 0,
            }))}
            chartType="bar"
            xKey="name"
            title="Subject-wise Attendance"
            yKeys={[{ key: 'percentage', name: 'Attendance %', color: '#6366f1' }]}
          />
        )}

        <AttendanceChart
          data={monthlyData}
          chartType="line"
          xKey="name"
          title="Monthly Attendance Trend"
          yKeys={[{ key: 'percentage', name: 'Attendance %', color: '#8b5cf6' }]}
        />
      </div>

      {/* Subject-wise Details */}
      {subjectData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Subject-wise Breakdown</h3>
          <div className="space-y-3">
            {subjectData.map((sub, i) => {
              const pct = sub.percentage || sub.attendancePercentage || 0;
              const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={i} className="p-4 bg-surface-dark rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">
                      {sub.subjectName || sub.subject?.name || sub.name}
                    </span>
                    <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Present: {sub.present || sub.presentCount || 0}</span>
                    <span>Absent: {sub.absent || sub.absentCount || 0}</span>
                    <span>Total: {sub.total || sub.totalClasses || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
