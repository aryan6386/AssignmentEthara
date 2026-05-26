import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineDownload, HiOutlineFilter } from 'react-icons/hi';

const TeacherReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ classId: '', subjectId: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [classRes, subRes] = await Promise.all([
        api.get('/teacher/classes'),
        api.get('/teacher/subjects'),
      ]);
      setClasses(classRes.data.classes || classRes.data || []);
      setSubjects(subRes.data.subjects || subRes.data || []);
    } catch (err) { console.error(err); }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      let url = '/reports/class/all';
      if (filters.classId) url = `/reports/class/${filters.classId}`;
      if (filters.subjectId) url = `/reports/subject/${filters.subjectId}`;

      const res = await api.get(url, { params });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate report');
      setReportData({ data: [] });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const params = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.subjectId) params.subjectId = filters.subjectId;

      const res = await api.get('/reports/download/csv', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  const chartData = reportData?.data?.map((item) => ({
    name: item.name || item.studentName || item.className || '-',
    present: item.present || item.presentCount || 0,
    absent: item.absent || item.absentCount || 0,
    percentage: item.percentage || item.attendancePercentage || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <HiOutlineChartBar className="w-7 h-7 text-primary" /> Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Generate attendance reports for your classes</p>
        </div>
        {reportData && (
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            <HiOutlineDownload className="w-5 h-5" /> Download CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <HiOutlineFilter className="w-4 h-4" /> Filter Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value })} className={inputClass}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.department?.name || ''} Sem {c.semester} Sec {c.section}</option>)}
          </select>
          <select value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })} className={inputClass}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName || s.name}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className={inputClass} />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className={inputClass} />
          <button onClick={generateReport} disabled={loading} className="px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50">
            Generate
          </button>
        </div>
      </div>

      {loading && <InlineSpinner />}

      {reportData && !loading && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <AttendanceChart
              data={chartData.slice(0, 20)}
              chartType="bar"
              xKey="name"
              title="Attendance Report"
              yKeys={[
                { key: 'present', name: 'Present', color: '#22c55e' },
                { key: 'absent', name: 'Absent', color: '#ef4444' },
              ]}
            />
          )}

          <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-dark/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {chartData.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No data available</td></tr>
                  ) : chartData.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-300">{item.name}</td>
                      <td className="px-6 py-3 text-sm text-emerald-400">{item.present}</td>
                      <td className="px-6 py-3 text-sm text-red-400">{item.absent}</td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        <span className={item.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}>
                          {item.percentage?.toFixed?.(1) || item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;
