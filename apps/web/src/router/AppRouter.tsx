import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { ClassroomsProvider } from '../context/ClassroomsProvider';
import { ROUTES } from '../constants/routes';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Landing } from '../pages/Landing/Landing';
import { Login } from '../pages/Login/Login';
import { Signup } from '../pages/Signup/Signup';
import { TeacherDashboard } from '../pages/TeacherDashboard/TeacherDashboard';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClassroomsProvider>
          <Routes>
            <Route
              path={ROUTES.LANDING}
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.LOGIN}
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path={ROUTES.SIGNUP}
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Panel del niño */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.WORLDS}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={`${ROUTES.WORLDS}/:worldId`}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.TROPHY_ROOM}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.CLASSROOM}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.SETTINGS}
              element={
                <PrivateRoute role="child">
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Panel del profesor */}
            <Route
              path={ROUTES.TEACHER}
              element={<Navigate to={ROUTES.TEACHER_GROUPS} replace />}
            />
            <Route
              path={ROUTES.TEACHER_GROUPS}
              element={
                <PrivateRoute role="tutor">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={`${ROUTES.TEACHER_GROUPS}/:groupId`}
              element={
                <PrivateRoute role="tutor">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.TEACHER_PANEL}
              element={
                <PrivateRoute role="tutor">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={`${ROUTES.TEACHER_PANEL}/:groupId`}
              element={
                <PrivateRoute role="tutor">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path={ROUTES.TEACHER_SETTINGS}
              element={
                <PrivateRoute role="tutor">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
          </Routes>
        </ClassroomsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
