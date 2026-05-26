import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineFilter } from 'react-icons/hi';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ classId: '', subjectId: '', startDate: '', endDate: '' });
  const [editModal, setEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchHistory();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/teacher/classes');
      setClasses(res.data.classes || res.data || []);
      const subRes = await api.get('/teacher/subjects');
      setSubjects(subRes.data.subjects || subRes.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/attendance/history', { params });
      const rawRecords = res.data.records || res.data.attendance || res.data || [];
      
      const flattened = [];
      rawRecords.forEach(session => {
        if (session.records && Array.isArray(session.records)) {
          session.records.forEach(r => {
            const student = r.studentId;
            flattened.push({
              _id: session._id,
              date: session.date,
              subject: session.subjectId,
              class: session.classId,
              student: {
                _id: student?._id,
                name: student?.userId?.name || 'Unknown Student',
                rollNo: student?.rollNo || '-'
              },
              status: r.status ? r.status.toLowerCase() : 'present',
              remarks: r.remarks || '',
              studentId: student?._id
            });
          });
        }
      });

      setRecords(flattened);
    } catch (err) {
      toast.error('Failed to fetch attendance history');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditStatus(record.status || 'present');
    setEditModal(true);
  };

  const handleUpdateRecord = async () => {
    try {
      await api.put(`/attendance/${editingRecord._id}`, {
        studentId: editingRecord.student?._id || editingRecord.studentId,
        status: editStatus
      });
      toast.success('Record updated');
      setEditModal(false);
      fetchHistory();
    } catch (err) {
      toast.error('Failed to update record');
    }
  };

  const columns = [
    { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString(), render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Student', accessor: (row) => row.student?.name || row.studentName || '-', render: (row) => row.student?.name || row.studentName || '-' },
    { header: 'Roll No', accessor: (row) => row.student?.rollNo || row.rollNo || '-', render: (row) => row.student?.rollNo || row.rollNo || '-' },
    { header: 'Subject', accessor: (row) => row.subject?.subjectName || row.subject?.name || row.subjectName || '-', render: (row) => row.subject?.subjectName || row.subject?.name || row.subjectName || '-' },
    { header: 'Status', render: (row) => {
      const status = row.status || 'present';
      const colors = { present: 'bg-emerald-500/20 text-emerald-400', absent: 'bg-red-500/20 text-red-400', late: 'bg-amber-500/20 text-amber-400' };
      return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[status] || colors.present}`}>{status}</span>;
    }},
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HiOutlineClock className="w-7 h-7 text-primary" />
          Attendance History
        </h1>
        <p className="text-slate-400 text-sm mt-1">View and manage past attendance records</p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <HiOutlineFilter className="w-4 h-4" /> Filters
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
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className={inputClass} placeholder="Start Date" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className={inputClass} placeholder="End Date" />
          <button onClick={fetchHistory} className="px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
            Apply
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={records} loading={loading} onEdit={handleEdit} emptyMessage="No attendance records found" />

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Attendance Record" size="sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400">Student: <span className="text-slate-200 font-medium">{editingRecord?.student?.name || editingRecord?.studentName}</span></p>
            <p className="text-sm text-slate-400 mt-1">Date: <span className="text-slate-200 font-medium">{editingRecord?.date ? new Date(editingRecord.date).toLocaleDateString() : ''}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <div className="flex gap-3">
              {['present', 'absent', 'late'].map((status) => (
                <button
                  key={status}
                  onClick={() => setEditStatus(status)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                    editStatus === status
                      ? status === 'present' ? 'bg-emerald-500 text-white' : status === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button onClick={() => setEditModal(false)} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button onClick={handleUpdateRecord} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceHistory;
