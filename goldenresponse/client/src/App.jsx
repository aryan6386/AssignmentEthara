import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FullPageSpinner } from './components/LoadingSpinner';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageClasses from './pages/admin/ManageClasses';
import ManageDepartments from './pages/admin/ManageDepartments';
import AdminReports from './pages/admin/AdminReports';
import LowAttendanceList from './pages/admin/LowAttendanceList';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MarkAttendance from './pages/teacher/MarkAttendance';
import AttendanceHistory from './pages/teacher/AttendanceHistory';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherProfile from './pages/teacher/TeacherProfile';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentReports from './pages/student/StudentReports';
import StudentProfile from './pages/student/StudentProfile';

const App = () => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <FullPageSpinner />;

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'teacher': return '/teacher/dashboard';
      case 'student': return '/student/dashboard';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/teachers" element={<ManageTeachers />} />
        <Route path="/admin/subjects" element={<ManageSubjects />} />
        <Route path="/admin/classes" element={<ManageClasses />} />
        <Route path="/admin/departments" element={<ManageDepartments />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/low-attendance" element={<LowAttendanceList />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']}><Layout /></ProtectedRoute>}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/mark-attendance" element={<MarkAttendance />} />
        <Route path="/teacher/attendance-history" element={<AttendanceHistory />} />
        <Route path="/teacher/reports" element={<TeacherReports />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']}><Layout /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/reports" element={<StudentReports />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Catch All */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default App;
