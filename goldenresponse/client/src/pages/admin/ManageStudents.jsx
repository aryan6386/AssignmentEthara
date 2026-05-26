import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', rollNo: '', department: '', semester: '', section: '', batch: '',
  });
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      setStudents(res.data.students || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || res.data || []);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        await api.put(`/admin/students/${editingStudent._id}`, formData);
        toast.success('Student updated successfully');
      } else {
        await api.post('/admin/students', formData);
        toast.success('Student added successfully');
      }
      setModalOpen(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      password: '',
      rollNo: student.rollNo || '',
      department: student.department || '',
      semester: student.semester || '',
      section: student.section || '',
      batch: student.batch || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.userId?.name || ''}?`)) return;
    try {
      await api.delete(`/admin/students/${student._id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({ name: '', email: '', password: '', rollNo: '', department: '', semester: '', section: '', batch: '' });
  };

  const columns = [
    { header: 'Name', accessor: (row) => row.userId?.name || '-', render: (row) => row.userId?.name || '-' },
    { header: 'Email', accessor: (row) => row.userId?.email || '-', render: (row) => row.userId?.email || '-' },
    { header: 'Roll No', accessor: 'rollNo' },
    { header: 'Department', accessor: (row) => row.department || '-', render: (row) => row.department || '-' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Section', accessor: 'section' },
    { header: 'Batch', accessor: 'batch' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Students</h1>
          <p className="text-slate-400 text-sm mt-1">Add, edit, and manage student records</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <HiOutlinePlus className="w-5 h-5" /> Add Student
        </button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No students found"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@college.edu" className={inputClass} required />
            </div>
            {!editingStudent && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" className={inputClass} required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Roll Number</label>
              <input type="text" value={formData.rollNo} onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })} placeholder="CS2024001" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} required>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Section</label>
              <input type="text" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="A" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Batch</label>
              <input type="text" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} placeholder="2024-2028" className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {editingStudent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageStudents;
