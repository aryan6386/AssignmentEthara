import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineSpinner } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineClipboardCheck, HiOutlineCheckCircle } from 'react-icons/hi';

const MarkAttendance = () => {
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudents();
    }
  }, [selectedClass, selectedSubject]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/teacher/classes');
      setClasses(res.data.classes || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/teacher/subjects', { params: { classId: selectedClass } });
      setSubjects(res.data.subjects || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const cls = classes.find(c => c._id === selectedClass);
      const studentList = cls?.students || [];
      setStudents(studentList);
      // Initialize all as present
      const initial = {};
      studentList.forEach((s) => {
        initial[s._id] = 'present';
      });
      setAttendance(initial);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => {
        const capitalizedStatus = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Late';
        return {
          studentId,
          status: capitalizedStatus,
        };
      });

      await api.post('/attendance/mark', {
        classId: selectedClass,
        subjectId: selectedSubject,
        date: selectedDate,
        records,
      });

      toast.success('Attendance marked successfully!');
      setStep(1);
      setSelectedClass('');
      setSelectedSubject('');
      setStudents([]);
      setAttendance({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-surface-dark border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 border-emerald-500';
      case 'absent': return 'bg-red-500 border-red-500';
      case 'late': return 'bg-amber-500 border-amber-500';
      default: return 'bg-slate-600 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HiOutlineClipboardCheck className="w-7 h-7 text-primary" />
          Mark Attendance
        </h1>
        <p className="text-slate-400 text-sm mt-1">Select class, subject, and mark student attendance</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'gradient-indigo text-white shadow-lg shadow-primary/25' : 'bg-slate-700 text-slate-400'
            }`}>
              {step > s ? <HiOutlineCheckCircle className="w-5 h-5" /> : s}
            </div>
            <span className={`text-sm hidden sm:block ${step >= s ? 'text-slate-200' : 'text-slate-500'}`}>
              {s === 1 ? 'Select Class' : s === 2 ? 'Select Subject & Date' : 'Mark Attendance'}
            </span>
            {s < 3 && <div className={`w-8 sm:w-16 h-0.5 ${step > s ? 'bg-primary' : 'bg-slate-700'}`}></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Select Class */}
      {step === 1 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Select Class</h3>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputClass}>
            <option value="">Choose a class...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.department?.name || c.departmentName || ''} - Sem {c.semester} - Sec {c.section} {c.batch ? `(${c.batch})` : ''}
              </option>
            ))}
          </select>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => selectedClass && setStep(2)}
              disabled={!selectedClass}
              className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Subject & Date */}
      {step === 2 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Select Subject & Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className={inputClass}>
                <option value="">Choose subject...</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.subjectName || s.name} ({s.subjectCode || s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Back</button>
            <button
              onClick={() => selectedSubject && setStep(3)}
              disabled={!selectedSubject}
              className="px-6 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Mark Attendance */}
      {step === 3 && (
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-200">Mark Student Attendance</h3>
            <div className="flex gap-2">
              <button onClick={() => handleMarkAll('present')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                All Present
              </button>
              <button onClick={() => handleMarkAll('absent')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">
                All Absent
              </button>
            </div>
          </div>

          {loading ? (
            <InlineSpinner />
          ) : students.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No students found for this class</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {students.map((student, i) => {
                  const studentId = student._id || student.student?._id;
                  return (
                    <div key={studentId || i} className="flex items-center justify-between p-4 bg-surface-dark rounded-xl hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm w-8">{i + 1}.</span>
                        <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center text-white text-sm font-bold">
                          {(student.name || student.studentName || 'S').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{student.name || student.studentName}</p>
                          <p className="text-xs text-slate-500">{student.rollNo || ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {['present', 'absent', 'late'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setAttendance({ ...attendance, [studentId]: status })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                              attendance[studentId] === status
                                ? `${getStatusColor(status)} text-white shadow-lg`
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 flex items-center justify-between p-4 bg-surface-dark rounded-xl border border-slate-700">
                <div className="flex gap-6">
                  <span className="text-sm text-emerald-400">
                    Present: {Object.values(attendance).filter((v) => v === 'present').length}
                  </span>
                  <span className="text-sm text-red-400">
                    Absent: {Object.values(attendance).filter((v) => v === 'absent').length}
                  </span>
                  <span className="text-sm text-amber-400">
                    Late: {Object.values(attendance).filter((v) => v === 'late').length}
                  </span>
                </div>
                <span className="text-sm text-slate-400">Total: {students.length}</span>
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2.5 gradient-indigo text-white font-medium rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  Submit Attendance
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
