import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineSpinner } from '../../components/LoadingSpinner';
import LowAttendanceBadge from '../../components/LowAttendanceBadge';
import toast from 'react-hot-toast';
import { HiOutlineExclamationCircle, HiOutlineSearch } from 'react-icons/hi';

const LowAttendanceList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    fetchLowAttendance();
  }, [threshold]);

  const fetchLowAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/low-attendance', { params: { threshold } });
      setStudents(res.data.students || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch data');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      (s.name || s.studentName || '').toLowerCase().includes(searchLower) ||
      (s.department?.name || s.departmentName || '').toLowerCase().includes(searchLower) ||
      (s.rollNo || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HiOutlineExclamationCircle className="w-7 h-7 text-amber-400" />
          Low Attendance Students
        </h1>
        <p className="text-slate-400 text-sm mt-1">Students with attendance below the threshold</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, department, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Threshold:</label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="px-3 py-2.5 bg-surface border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={50}>50%</option>
            <option value={60}>60%</option>
            <option value={65}>65%</option>
            <option value={70}>70%</option>
            <option value={75}>75%</option>
            <option value={80}>80%</option>
          </select>
        </div>
      </div>

      {loading ? (
        <InlineSpinner />
      ) : (
        <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <span className="text-sm text-slate-400">{filteredStudents.length} student(s) found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-dark/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {students.length === 0 ? 'No students with low attendance. Great!' : 'No matching results'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, i) => (
                    <tr key={s._id || i} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-rose flex items-center justify-center text-white text-xs font-bold">
                            {(s.name || s.studentName || 'S').charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-200">{s.name || s.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{s.rollNo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{s.department?.name || s.departmentName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{s.class?.section ? `Sem ${s.class.semester} - ${s.class.section}` : s.className || '-'}</td>
                      <td className="px-6 py-4">
                        <LowAttendanceBadge percentage={s.attendancePercentage || s.percentage || 0} threshold={threshold} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowAttendanceList;
