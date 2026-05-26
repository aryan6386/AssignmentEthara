import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineSpinner } from '../../components/LoadingSpinner';
import { HiOutlineUser, HiOutlineMail, HiOutlineIdentification, HiOutlineOfficeBuilding, HiOutlineBookOpen } from 'react-icons/hi';

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/teacher/profile');
      const teacherData = res.data.teacher;
      const classesData = res.data.classes;
      if (teacherData) {
        setProfile({
          ...teacherData,
          name: teacherData.userId?.name || '',
          email: teacherData.userId?.email || '',
          subjects: teacherData.assignedSubjects || [],
          classes: classesData || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InlineSpinner />;

  const infoItems = [
    { icon: HiOutlineUser, label: 'Full Name', value: profile?.name },
    { icon: HiOutlineMail, label: 'Email', value: profile?.email },
    { icon: HiOutlineIdentification, label: 'Employee ID', value: profile?.employeeId },
    { icon: HiOutlineOfficeBuilding, label: 'Department', value: profile?.department?.name || profile?.department },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Your personal and professional details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Banner */}
        <div className="h-32 gradient-indigo relative">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-20 h-20 rounded-2xl bg-surface border-4 border-surface flex items-center justify-center text-3xl font-bold text-primary shadow-xl">
              {profile?.name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-14 px-6 pb-6">
          <h2 className="text-xl font-bold text-slate-100">{profile?.name}</h2>
          <p className="text-sm text-slate-400 mt-1">Teacher • {profile?.department?.name || profile?.department || ''}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-dark rounded-xl">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{item.value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Subjects & Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <HiOutlineBookOpen className="w-5 h-5 text-primary" /> Assigned Subjects
          </h3>
          <div className="space-y-2">
            {(profile?.subjects || []).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No subjects assigned</p>
            ) : (
              profile.subjects.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-dark rounded-xl">
                  <span className="text-sm text-slate-300">{sub.subjectName || sub.name || sub}</span>
                  <span className="text-xs text-slate-500 font-mono">{sub.subjectCode || sub.code || ''}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <HiOutlineOfficeBuilding className="w-5 h-5 text-primary" /> Assigned Classes
          </h3>
          <div className="space-y-2">
            {(profile?.classes || []).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No classes assigned</p>
            ) : (
              profile.classes.map((cls, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-dark rounded-xl">
                  <span className="text-sm text-slate-300">
                    {cls.department?.name || ''} - Sem {cls.semester} Sec {cls.section}
                  </span>
                  <span className="text-xs text-slate-500">{cls.batch || ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
