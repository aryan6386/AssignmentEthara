import { useState, useEffect } from 'react';
import api from '../../utils/api';
import AttendanceChart from '../../components/AttendanceChart';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineDocumentReport, HiOutlineDownload } from 'react-icons/hi';

const StudentReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/attendance/summary');
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const res = await api.get('/reports/download/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  if (loading) return <InlineSpinner />;

  const subjectData = reportData?.subjectWise || reportData?.subjects || [];

  const chartData = subjectData.map((s) => ({
    name: s.subjectName || s.subject?.name || s.name || 'Subject',
    present: s.present || s.presentCount || 0,
    absent: s.absent || s.absentCount || 0,
    percentage: s.percentage || s.attendancePercentage || 0,
  }));

  const pieData = [
    { name: 'Present', value: reportData?.totalPresent || reportData?.present || 0 },
    { name: 'Absent', value: reportData?.totalAbsent || reportData?.absent || 0 },
    { name: 'Late', value: reportData?.totalLate || reportData?.late || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <HiOutlineDocumentReport className="w-7 h-7 text-primary" /> My Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">View and download your attendance reports</p>
        </div>
        <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
          <HiOutlineDownload className="w-5 h-5" /> Download
        </button>
      </div>

      {/* Overall Summary */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Overall Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-surface-dark rounded-xl">
            <p className="text-3xl font-bold text-primary">
              {(reportData?.overallPercentage || reportData?.percentage || reportData?.attendancePercentage || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Overall Attendance</p>
          </div>
          <div className="text-center p-4 bg-surface-dark rounded-xl">
            <p className="text-3xl font-bold text-emerald-400">{reportData?.totalPresent || reportData?.present || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Classes Present</p>
          </div>
          <div className="text-center p-4 bg-surface-dark rounded-xl">
            <p className="text-3xl font-bold text-red-400">{reportData?.totalAbsent || reportData?.absent || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Classes Absent</p>
          </div>
          <div className="text-center p-4 bg-surface-dark rounded-xl">
            <p className="text-3xl font-bold text-slate-300">{reportData?.totalClasses || reportData?.total || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Total Classes</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.length > 0 && (
          <AttendanceChart
            data={chartData}
            chartType="bar"
            xKey="name"
            title="Subject-wise Attendance %"
            yKeys={[{ key: 'percentage', name: 'Attendance %', color: '#6366f1' }]}
          />
        )}
        {pieData.length > 0 && (
          <AttendanceChart
            data={pieData}
            chartType="pie"
            xKey="name"
            yKey="value"
            title="Attendance Distribution"
            colors={['#22c55e', '#ef4444', '#f59e0b']}
          />
        )}
      </div>

      {/* Subject Table */}
      {chartData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-200">Subject-wise Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dark/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {chartData.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-200">{item.name}</td>
                    <td className="px-6 py-3 text-sm text-emerald-400">{item.present}</td>
                    <td className="px-6 py-3 text-sm text-red-400">{item.absent}</td>
                    <td className="px-6 py-3 text-sm font-semibold">
                      <span className={item.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.percentage >= 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.percentage >= 75 ? 'Good' : 'Low'}
                      </span>
                    </td>
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

export default StudentReports;
