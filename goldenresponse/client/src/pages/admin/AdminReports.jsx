import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineFilter } from 'react-icons/hi';

const AdminReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    department: '', class: '', subject: '', startDate: '', endDate: '',
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [deptRes, classRes, subRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
      ]);
      setDepartments(deptRes.data.departments || deptRes.data || []);
      setClasses(classRes.data.classes || classRes.data || []);
      setSubjects(subRes.data.subjects || subRes.data || []);
    } catch (err) { console.error(err); }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      let url = '/reports/class/all';
      if (filters.class) url = `/reports/class/${filters.class}`;
      if (filters.subject) url = `/reports/subject/${filters.subject}`;

      const res = await api.get(url, { params });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate report');
      // Set sample data for display
      setReportData({
        summary: { totalClasses: 0, avgAttendance: 0 },
        data: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const params = {};
      if (filters.class) params.classId = filters.class;
      if (filters.subject) params.subjectId = filters.subject;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/reports/download/csv', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  const chartData = reportData?.data?.map((item) => ({
    name: item.name || item.studentName || item.className || 'N/A',
    present: item.present || item.presentCount || 0,
    absent: item.absent || item.absentCount || 0,
    percentage: item.percentage || item.attendancePercentage || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Generate and download attendance reports</p>
        </div>
        {reportData && (
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            <HiOutlineDownload className="w-5 h-5" /> Download CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <HiOutlineFilter className="w-5 h-5" /> Filter Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className={inputClass}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Class</label>
            <select value={filters.class} onChange={(e) => setFilters({ ...filters, class: e.target.value })} className={inputClass}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{`${c.department?.name || ''} - Sem ${c.semester} Sec ${c.section}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
            <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} className={inputClass}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName || s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className={inputClass} />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="w-full px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <HiOutlineFilter className="w-4 h-4" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && <InlineSpinner />}

      {reportData && !loading && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart
                data={chartData.slice(0, 20)}
                chartType="bar"
                xKey="name"
                title="Attendance Distribution"
                yKeys={[
                  { key: 'present', name: 'Present', color: '#22c55e' },
                  { key: 'absent', name: 'Absent', color: '#ef4444' },
                ]}
              />
              <AttendanceChart
                data={chartData.slice(0, 20)}
                chartType="line"
                xKey="name"
                title="Attendance Percentage"
                yKeys={[{ key: 'percentage', name: 'Attendance %', color: '#6366f1' }]}
              />
            </div>
          )}

          {/* Data Table */}
          <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-200">Report Data</h3>
            </div>
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
                      <td className="px-6 py-3 text-sm">
                        <span className={`font-semibold ${item.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
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

export default AdminReports;
