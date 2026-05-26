import { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDept) {
        await api.put(`/admin/departments/${editingDept._id}`, formData);
        toast.success('Department updated');
      } else {
        await api.post('/admin/departments', formData);
        toast.success('Department added');
      }
      setModalOpen(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name || '', code: dept.code || '' });
    setModalOpen(true);
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department ${dept.name}?`)) return;
    try {
      await api.delete(`/admin/departments/${dept._id}`);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '' });
  };

  const columns = [
    { header: 'Department Name', accessor: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-violet flex items-center justify-center text-white text-sm font-bold">
          {row.name?.charAt(0) || 'D'}
        </div>
        <span className="font-medium text-slate-200">{row.name}</span>
      </div>
    )},
    { header: 'Code', accessor: 'code', render: (row) => (
      <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-mono font-semibold">{row.code || '-'}</span>
    )},
  ];

  const inputClass = "w-full px-4 py-2.5 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Departments</h1>
          <p className="text-slate-400 text-sm mt-1">Add and manage departments</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <HiOutlinePlus className="w-5 h-5" /> Add Department
        </button>
      </div>

      <DataTable columns={columns} data={departments} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No departments found" />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingDept ? 'Edit Department' : 'Add New Department'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Computer Science" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Department Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS" className={inputClass} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {editingDept ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDepartments;
