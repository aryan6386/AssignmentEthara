import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ department: '', semester: '', section: '', batch: '', students: [], subjects: [] });
  const [departments, setDepartments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchDepartments();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/classes');
      setClasses(res.data.classes || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch classes');
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

  const fetchStudentsAndSubjects = async () => {
    try {
      const [studRes, subRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/subjects'),
      ]);
      setAllStudents(studRes.data.students || studRes.data || []);
      setAllSubjects(subRes.data.subjects || subRes.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingClass) {
        await api.put(`/admin/classes/${editingClass._id}`, formData);
        toast.success('Class updated');
      } else {
        await api.post('/admin/classes', formData);
        toast.success('Class added');
      }
      setModalOpen(false);
      resetForm();
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      department: cls.department?._id || cls.department || '',
      semester: cls.semester || '',
      section: cls.section || '',
      batch: cls.batch || '',
      students: cls.students?.map(s => s._id || s) || [],
      subjects: cls.subjects?.map(s => s._id || s) || [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (cls) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await api.delete(`/admin/classes/${cls._id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  const handleManage = (cls) => {
    setSelectedClass(cls);
    fetchStudentsAndSubjects();
    setManageModalOpen(true);
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({ department: '', semester: '', section: '', batch: '', students: [], subjects: [] });
  };

  const columns = [
    { header: 'Department', accessor: (row) => row.department?.name || row.department || '-', render: (row) => row.department?.name || row.department || '-' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Section', accessor: 'section' },
    { header: 'Batch', accessor: 'batch' },
    { header: 'Students', accessor: (row) => row.students?.length || 0, render: (row) => (
      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium">{row.students?.length || 0} students</span>
    )},
    { header: 'Manage', render: (row) => (
      <button onClick={() => handleManage(row)} className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors">
        Manage
      </button>
    )},
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Classes</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage class sections</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <HiOutlinePlus className="w-5 h-5" /> Add Class
        </button>
      </div>

      <DataTable columns={columns} data={classes} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No classes found" />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingClass ? 'Edit Class' : 'Add New Class'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} required>
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Semester</label>
              <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className={inputClass} required>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Section</label>
              <input type="text" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="A" className={inputClass} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Batch</label>
            <input type="text" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} placeholder="2024-2028" className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {editingClass ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Students/Subjects Modal */}
      <Modal isOpen={manageModalOpen} onClose={() => setManageModalOpen(false)} title={`Manage - ${selectedClass?.department?.name || ''} Sem ${selectedClass?.semester || ''} Sec ${selectedClass?.section || ''}`} size="xl">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Students in Class</h4>
            <div className="max-h-48 overflow-y-auto bg-surface-dark rounded-xl p-3 border border-slate-700">
              {selectedClass?.students?.length ? selectedClass.students.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300 text-sm">{s.name || s}</span>
                  <span className="text-slate-500 text-xs">{s.rollNo || ''}</span>
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-4">No students assigned</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Subjects in Class</h4>
            <div className="max-h-48 overflow-y-auto bg-surface-dark rounded-xl p-3 border border-slate-700">
              {selectedClass?.subjects?.length ? selectedClass.subjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300 text-sm">{s.subjectName || s.name || s}</span>
                  <span className="text-slate-500 text-xs">{s.subjectCode || s.code || ''}</span>
                </div>
              )) : <p className="text-slate-500 text-sm text-center py-4">No subjects assigned</p>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageClasses;
