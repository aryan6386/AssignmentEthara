import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ subjectName: '', subjectCode: '', department: '', semester: '', teacherId: '' });
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.subjects || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data.teachers || res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject._id}`, formData);
        toast.success('Subject updated');
      } else {
        await api.post('/admin/subjects', formData);
        toast.success('Subject added');
      }
      setModalOpen(false);
      resetForm();
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subjectName: subject.subjectName || subject.name || '',
      subjectCode: subject.subjectCode || subject.code || '',
      department: subject.department?._id || subject.department || '',
      semester: subject.semester || '',
      teacherId: subject.teacherId?._id || subject.teacherId || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete subject ${subject.subjectName || subject.name}?`)) return;
    try {
      await api.delete(`/admin/subjects/${subject._id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({ subjectName: '', subjectCode: '', department: '', semester: '', teacherId: '' });
  };

  const columns = [
    { header: 'Subject Name', accessor: (row) => row.subjectName || row.name, render: (row) => row.subjectName || row.name || '-' },
    { header: 'Code', accessor: (row) => row.subjectCode || row.code, render: (row) => <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-mono">{row.subjectCode || row.code || '-'}</span> },
    { header: 'Department', accessor: (row) => row.department || '-', render: (row) => row.department || '-' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Teacher', accessor: (row) => row.teacherId?.userId?.name || '-', render: (row) => row.teacherId?.userId?.name || '-' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">Add, edit, and manage course subjects</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <HiOutlinePlus className="w-5 h-5" /> Add Subject
        </button>
      </div>

      <DataTable columns={columns} data={subjects} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No subjects found" />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingSubject ? 'Edit Subject' : 'Add New Subject'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject Name</label>
            <input type="text" value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} placeholder="Data Structures" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject Code</label>
            <input type="text" value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} placeholder="CS201" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} required>
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Semester</label>
            <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className={inputClass} required>
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Teacher</label>
            <select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} className={inputClass}>
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.userId?.name || 'Unknown'}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {editingSubject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageSubjects;
