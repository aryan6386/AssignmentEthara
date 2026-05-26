MERN College Attendance Management System
Project Overview
Build a full-stack MERN College Attendance Management System for colleges to digitally manage student attendance, reduce manual register work, and provide a reliable platform for students, teachers, and college management.
The project should include:
•	Secure role-based login system
•	Admin control panel
•	Teacher attendance marking
•	Student attendance summary
•	Charts, analytics, and downloadable reports
________________________________________
Tech Stack
React.js — builds the frontend UI including login page, admin, teacher, and student dashboards, attendance pages, and reports
React Router DOM — handles navigation between pages like login, dashboard, profile, and reports without reloading the browser
Axios — sends requests from the React frontend to backend APIs for actions like login, adding students, marking attendance, and fetching reports
Tailwind CSS — designs a clean, modern, and responsive UI that works across mobile, tablet, and desktop screens
Context API — manages global data such as the logged-in user, role, token, and logout function across the entire app
Chart.js / Recharts — displays attendance data visually through graphs and charts like subject-wise attendance and monthly attendance trends
Node.js — runs JavaScript on the server side and handles all backend logic
Express.js — creates backend APIs for authentication, students, teachers, attendance, classes, subjects, and reports
MongoDB — stores all application data including users, students, teachers, subjects, classes, and attendance records
Mongoose — defines database schemas and models to interact with MongoDB in a structured way
JWT Authentication — secures the login system and enforces role-based access control for admin, teacher, and student
bcrypt.js — hashes passwords before saving them to the database to ensure secure storage
dotenv — stores sensitive configuration values like database URL, JWT secret key, and server port safely outside the codebase
CORS — allows the frontend and backend to communicate with each other when running on different ports
REST APIs — connect the frontend and backend through defined routes such as login, add student, mark attendance, and generate reports
________________________________________
Project Structure
Create 2 separate folders:
bash
attendance-system/
│
├── backend/    → Node.js + Express + MongoDB backend
└── frontend/   → React.js frontend
________________________________________
FEATURES REQUIRED
1. USER AUTHENTICATION
•	Login page
•	Logout functionality
•	JWT token authentication
•	Role-based access control (Admin / Teacher / Student)
•	Store token securely via Context API
•	Protected routes
•	Session persistence
•	Show logged-in user info
________________________________________
2. USER ROLES
Admin can:
•	Add, update, delete students and teachers
•	Create departments, classes, semesters, sections, subjects
•	Assign subjects to teachers
•	Assign students to classes
•	View all attendance records
•	Generate and download reports
•	View low-attendance students
•	Manage user accounts
Teacher can:
•	View assigned subjects and classes
•	Mark and edit attendance
•	View attendance history
•	Generate class-wise reports
•	View low-attendance students
Student can:
•	View profile details
•	View subject-wise and overall attendance percentage
•	View attendance history
•	Receive low-attendance warnings
•	Download attendance report
________________________________________
3. ADMIN DASHBOARD
Display:
•	Total students count
•	Total teachers count
•	Total classes count
•	Total subjects count
•	Total departments count
•	Low-attendance student count
•	Recent attendance activity
•	Report generation options
•	Quick links to manage students, teachers, subjects, and classes
________________________________________
4. TEACHER DASHBOARD
Display:
•	Assigned classes
•	Assigned subjects
•	Mark attendance button
•	Low-attendance students
•	Class-wise attendance summary
•	Attendance history
•	Report generation options
________________________________________
5. STUDENT DASHBOARD
Display:
•	Overall attendance percentage
•	Subject-wise attendance percentage
•	Total present classes
•	Total absent classes
•	Total late records
•	Monthly attendance chart
•	Low-attendance warning message
Example warning:
Your attendance in Maths is below 75%. Please attend upcoming classes regularly.
________________________________________
6. ATTENDANCE MANAGEMENT
Teacher must be able to mark attendance by selecting:
•	Department
•	Semester
•	Section
•	Subject
•	Date
•	Student list
Attendance status options:
•	Present
•	Absent
•	Late
Each attendance record should include:
•	Student ID
•	Status
•	Remarks
________________________________________
7. ATTENDANCE CALCULATION
The system must calculate:
•	Total classes conducted
•	Total classes attended
•	Total absent classes
•	Total late records
•	Subject-wise attendance percentage
•	Overall attendance percentage
•	Low attendance status
Formula:
Attendance Percentage = (Total Present Classes / Total Conducted Classes) * 100
Low attendance condition: If attendance percentage < 75%, show warning.
________________________________________
8. DATABASE MODELS
User Model
js
{
  name,
  email,
  password,
  role,       // admin | teacher | student
  isActive
}
Student Model
js
{
  userId,
  student_id,
  name,
  email,
  rollNo,
  department,
  semester,
  section,
  batch
}
Teacher Model
js
{
  userId,
  teacher_id,
  name,
  email,
  employee_id,
  department,
  assigned_subjects
}
Subject Model
js
{
  subject_id,
  subject_name,
  subject_code,
  department,
  semester,
  teacher_id
}
Class Model
js
{
  class_id,
  department,
  semester,
  section,
  batch,
  subjects,
  students
}
Attendance Model
js
{
  attendance_id,
  class_id,
  subject_id,
  teacher_id,
  date,
  attendance_records: [
    { student_id, status, remarks }
  ]
}
// status: ["Present", "Absent", "Late"]
________________________________________
9. BACKEND API
Create REST APIs for:
Authentication APIs
•	Register user
•	Login user
•	Get logged-in user profile
•	Logout user
Admin APIs
•	Add / Update / Delete student
•	Add / Update / Delete teacher
•	Create department, class, subject
•	Assign teacher to subject
•	Assign students to class
•	View all records
•	Generate reports
Teacher APIs
•	Get assigned classes and subjects
•	Mark attendance
•	Edit attendance
•	View attendance history
•	Generate class-wise report
•	View low-attendance students
Student APIs
•	View own profile
•	View subject-wise attendance
•	View overall attendance
•	View attendance history
•	Download report
________________________________________
10. REPORT GENERATION
The system must generate:
•	Student attendance dashboard
•	Teacher class attendance report
•	Admin-level attendance analytics
•	Subject-wise and class-wise attendance reports
•	Low-attendance student list
•	Downloadable PDF reports
•	Downloadable CSV reports
•	Attendance charts and graphs
________________________________________
11. FILES TO CREATE
BACKEND
bash
backend/
│
├── server.js
├── .env
├── package.json
├── config/
│   └── db.js
├── models/
│   ├── User.js
│   ├── Student.js
│   ├── Teacher.js
│   ├── Subject.js
│   ├── Class.js
│   └── Attendance.js
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── teacherRoutes.js
│   ├── studentRoutes.js
│   └── attendanceRoutes.js
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── teacherController.js
│   ├── studentController.js
│   └── attendanceController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── errorMiddleware.js
└── utils/
    ├── generateToken.js
    └── reportGenerator.js
FRONTEND
bash
frontend/
│
├── package.json
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/
    │   └── axiosInstance.js
    ├── context/
    │   └── AuthContext.jsx
    ├── routes/
    │   ├── ProtectedRoute.jsx
    │   └── RoleBasedRoute.jsx
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Sidebar.jsx
    │   ├── DashboardCard.jsx
    │   ├── AttendanceChart.jsx
    │   └── Table.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── AdminDashboard.jsx
    │   ├── TeacherDashboard.jsx
    │   ├── StudentDashboard.jsx
    │   ├── ManageStudents.jsx
    │   ├── ManageTeachers.jsx
    │   ├── ManageSubjects.jsx
    │   ├── ManageClasses.jsx
    │   ├── MarkAttendance.jsx
    │   ├── AttendanceHistory.jsx
    │   ├── Reports.jsx
    │   ├── LowAttendance.jsx
    │   ├── Profile.jsx
    │   └── Unauthorized.jsx
    └── styles/
        └── index.css
________________________________________
12. SECURITY
•	Hash passwords using bcrypt.js
•	Use JWT tokens for authentication
•	Role-based route authorization
•	Environment variables via dotenv
•	Input validation on all forms
•	Protected API routes with middleware
•	CORS setup for frontend-backend communication
•	Unauthorized access handling page
________________________________________
13. PERFORMANCE AND SCALABILITY
•	MongoDB indexing
•	Pagination for students, teachers, and attendance records
•	Search and filter options
•	Optimized database queries
•	Reusable React components
•	Modular backend folder structure
•	Role-based middleware
•	Error handling middleware
________________________________________
14. MODERN UI REQUIREMENTS
UI must include:
•	Smooth scrolling on all pages
•	Hover effects in the navigation bar
•	Clean and modern dashboard layout
•	Responsive design for mobile, tablet, and desktop
•	Sidebar navigation for dashboards
•	Cards for summary data
•	Charts and graphs for attendance analytics
•	Loading states
•	Empty states
•	Error messages
•	Toast notifications
________________________________________
15. CODE REQUIREMENTS
•	Write clean modular code
•	Add comments throughout
•	Use async/await
•	Separate API utilities
•	Proper folder structure
•	Beginner-friendly explanations in comments
________________________________________
16. FINAL OUTPUT REQUIRED
Provide:
•	Complete project code
•	Backend and frontend folder structure
•	MongoDB schema models
•	Authentication system with JWT
•	Role-based access control
•	All three dashboards (Admin, Teacher, Student)
•	Attendance marking and calculation logic
•	Low-attendance warning logic
•	Report generation (PDF + CSV)
•	Charts and graphs
•	Setup instructions
•	MongoDB connection guide
•	How to run backend and frontend
•	Postman testing instructions
•	Deployment guidance
________________________________________
DEVELOPMENT FLOW
Build the project step-by-step in this order:
1.	Backend setup
2.	MongoDB connection
3.	User authentication APIs
4.	Role-based middleware
5.	Student, Teacher, Subject, and Class models
6.	Admin management APIs
7.	Attendance marking APIs
8.	Attendance calculation logic
9.	Report generation APIs
10.	Frontend setup with React
11.	Routing with React Router DOM
12.	Login page
13.	Admin dashboard
14.	Teacher dashboard
15.	Student dashboard
16.	Attendance marking page
17.	Reports and charts
18.	PDF / CSV download
19.	Final testing and polishing
________________________________________
FINAL GOAL
The final application should work as a complete production-ready College Attendance Management System with:
•	Secure login
•	Role-based dashboards
•	Admin control panel
•	Teacher attendance marking
•	Student attendance summary
•	Subject-wise and class-wise reports
•	Low-attendance warnings
•	Charts and analytics
•	PDF / CSV report downloads
•	Responsive modern UI
•	Scalable backend architecture
