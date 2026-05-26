import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineFilter } from 'react-icons/hi';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table or calendar

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
  }, [selectedSubject]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSubject) params.subjectId = selectedSubject;
      const res = await api.get('/student/attendance', { params });
      const data = res.data.records || res.data.attendance || (Array.isArray(res.data) ? res.data : []);
      setAttendance(data);

      // Extract unique subjects
      const subjectSet = new Map();
      data.forEach((record) => {
        const sub = record.subject;
        if (sub && sub._id) {
          subjectSet.set(sub._id, sub);
        }
      });
      if (subjects.length === 0) {
        setSubjects(Array.from(subjectSet.values()));
      }
    } catch (err) {
      toast.error('Failed to fetch attendance');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/student/attendance/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    present: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    absent: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
    late: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  };

  // Group attendance by date for calendar view
  const groupedByDate = attendance.reduce((acc, record) => {
    const date = new Date(record.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HiOutlineCalendar className="w-7 h-7 text-primary" /> My Attendance
        </h1>
        <p className="text-slate-400 text-sm mt-1">View your detailed attendance records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <HiOutlineFilter className="w-4 h-4 text-slate-400" />
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className={`${inputClass} max-w-xs`}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName || s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Date View
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl border border-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{summary.present || summary.totalPresent || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Present</p>
          </div>
          <div className="bg-surface rounded-xl border border-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{summary.absent || summary.totalAbsent || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Absent</p>
          </div>
          <div className="bg-surface rounded-xl border border-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{summary.late || summary.totalLate || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Late</p>
          </div>
          <div className="bg-surface rounded-xl border border-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{(summary.percentage || summary.attendancePercentage || 0).toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">Overall</p>
          </div>
        </div>
      )}

      {loading ? (
        <InlineSpinner />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dark/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {attendance.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No attendance records</td></tr>
                ) : (
                  attendance.map((record, i) => {
                    const status = record.status ? record.status.toLowerCase() : 'present';
                    const colors = statusColors[status] || statusColors.present;
                    return (
                      <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-300">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{record.subject?.subjectName || record.subject?.name || record.subjectName || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors.bg} ${colors.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar/Date View */
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)).map((date) => (
            <div key={date} className="bg-surface rounded-2xl border border-slate-700/50 p-5">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
              <div className="space-y-2">
                {groupedByDate[date].map((record, i) => {
                  const status = record.status ? record.status.toLowerCase() : 'present';
                  const colors = statusColors[status] || statusColors.present;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-dark rounded-xl">
                      <span className="text-sm text-slate-300">{record.subject?.subjectName || record.subject?.name || record.subjectName || '-'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors.bg} ${colors.text}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groupedByDate).length === 0 && (
            <div className="text-center py-12 text-slate-500">No attendance records found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
