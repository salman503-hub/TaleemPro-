import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import CourseList from '../pages/CourseList';
import CourseAdd from '../pages/CourseAdd';
import GradeList from '../pages/GradeList';
import GradeEnter from '../pages/GradeEnter';
import StudentResultView from '../pages/StudentResultView';
import StudentList from '../pages/StudentList';
import StudentAdd from '../pages/StudentAdd';
import StudentEdit from '../pages/StudentEdit';
import TeacherList from '../pages/TeacherList';
import TeacherAdd from '../pages/TeacherAdd';
import TeacherEdit from '../pages/TeacherEdit';
import AttendanceMark from '../pages/AttendanceMark';
import AttendanceReport from '../pages/AttendanceReport';
import StudentAttendanceView from '../pages/StudentAttendanceView';
import Announcements from '../pages/Announcements';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import ChangePasswordForce from '../pages/ChangePasswordForce';
import Enrollments from '../pages/Enrollments';
import Departments from '../pages/Departments';
import Semesters from '../pages/Semesters';
import CurriculumBuilder from '../pages/CurriculumBuilder';
import Notifications from '../pages/Notifications';
import NotificationSettings from '../pages/NotificationSettings';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Forced Password Change */}
        <Route 
          path="/change-password-force" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <ChangePasswordForce />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/departments" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Departments />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/semesters" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Semesters />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/curriculum" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CurriculumBuilder />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <CourseList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/add" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CourseAdd />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/enrollments" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <Enrollments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/grades" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <GradeList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/grades/enter" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <GradeEnter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/grades/student" 
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentResultView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StudentList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/students/add" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StudentAdd />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/students/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StudentEdit />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TeacherList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/add" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TeacherAdd />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TeacherEdit />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance/mark" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <AttendanceMark />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance/report" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <AttendanceReport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance/student" 
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentAttendanceView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/announcements" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <Announcements />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings/notifications" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <NotificationSettings />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;

