import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineSpinner } from '../../components/LoadingSpinner';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineHashtag,
  HiOutlineCalendar,
} from 'react-icons/hi';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      const studentData = res.data.student;
      const classData = res.data.class;
      if (studentData) {
        setProfile({
          ...studentData,
          name: studentData.userId?.name || '',
          email: studentData.userId?.email || '',
          subjects: (classData?.subjects || []).map(sub => ({
            ...sub,
            teacher: sub.teacherId?.userId || null
          }))
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
    { icon: HiOutlineIdentification, label: 'Roll Number', value: profile?.rollNo },
    { icon: HiOutlineOfficeBuilding, label: 'Department', value: profile?.department?.name || profile?.department },
    { icon: HiOutlineAcademicCap, label: 'Semester', value: profile?.semester },
    { icon: HiOutlineHashtag, label: 'Section', value: profile?.section },
    { icon: HiOutlineCalendar, label: 'Batch', value: profile?.batch },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Your personal and academic details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Banner */}
        <div className="h-32 gradient-violet relative">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-20 h-20 rounded-2xl bg-surface border-4 border-surface flex items-center justify-center text-3xl font-bold text-secondary shadow-xl">
              {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <h2 className="text-xl font-bold text-slate-100">{profile?.name}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Student • {profile?.department?.name || profile?.department || ''} • Semester {profile?.semester || '-'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-dark rounded-xl">
                <div className="p-2.5 rounded-lg bg-secondary/10">
                  <item.icon className="w-5 h-5 text-secondary" />
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

      {/* Subjects & Teachers */}
      <div className="bg-surface rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <HiOutlineBookOpen className="w-5 h-5 text-secondary" /> My Subjects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(profile?.subjects || []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4 col-span-2">No subjects enrolled</p>
          ) : (
            profile.subjects.map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-dark rounded-xl hover:bg-slate-700/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-200">{sub.subjectName || sub.name || sub}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sub.subjectCode || sub.code || ''}</p>
                </div>
                {sub.teacher && (
                  <span className="text-xs text-slate-400 bg-surface rounded-lg px-2.5 py-1">
                    {sub.teacher?.name || sub.teacher || ''}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
