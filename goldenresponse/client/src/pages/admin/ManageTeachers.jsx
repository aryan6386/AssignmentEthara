import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', employeeId: '', department: '' });
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/teachers');
      setTeachers(res.data.teachers || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch teachers');
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
      if (editingTeacher) {
        await api.put(`/admin/teachers/${editingTeacher._id}`, formData);
        toast.success('Teacher updated successfully');
      } else {
        await api.post('/admin/teachers', formData);
        toast.success('Teacher added successfully');
      }
      setModalOpen(false);
      resetForm();
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.userId?.name || '',
      email: teacher.userId?.email || '',
      password: '',
      employeeId: teacher.employeeId || '',
      department: teacher.department?._id || teacher.department || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Delete teacher ${teacher.userId?.name || ''}?`)) return;
    try {
      await api.delete(`/admin/teachers/${teacher._id}`);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (err) {
      toast.error('Failed to delete teacher');
    }
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', password: '', employeeId: '', department: '' });
  };

  const columns = [
    { header: 'Name', accessor: (row) => row.userId?.name || '-', render: (row) => row.userId?.name || '-' },
    { header: 'Email', accessor: (row) => row.userId?.email || '-', render: (row) => row.userId?.email || '-' },
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Department', accessor: (row) => row.department?.name || row.department || '-', render: (row) => row.department?.name || row.department || '-' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Teachers</h1>
          <p className="text-slate-400 text-sm mt-1">Add, edit, and manage teacher records</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <HiOutlinePlus className="w-5 h-5" /> Add Teacher
        </button>
      </div>

      <DataTable columns={columns} data={teachers} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No teachers found" />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Smith" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@college.edu" className={inputClass} required />
          </div>
          {!editingTeacher && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" className={inputClass} required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Employee ID</label>
            <input type="text" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} placeholder="EMP001" className={inputClass} required />
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
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {editingTeacher ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageTeachers;
