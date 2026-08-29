import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { AuthCallback } from '../pages/AuthCallback/AuthCallback';
import { ClassroomsProvider } from '../context/ClassroomsProvider';
import { ROUTES } from '../constants/routes';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { Landing } from '../pages/Landing/Landing';
import { Login } from '../pages/Login/Login';
import { ResetPassword } from '../pages/ResetPassword/ResetPassword';
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
            <Route
              path={ROUTES.FORGOT_PASSWORD}
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            {/*
             * `PrivateRoute` SIN rol, y es el primer sitio que aprovecha que la
             * prop sea opcional. El enlace del correo abre una sesión de verdad:
             * con `PublicRoute` esa persona sería apartada a su panel y la
             * pantalla no se vería nunca, y declarar un rol rebotaría a la mitad
             * de la gente al panel del otro. Aquí hace falta sesión —que es lo
             * que el enlace aporta— y da igual el rol. Quien llegue sin enlace
             * acaba en `/login`, que es la respuesta correcta: sin sesión no hay
             * nada que fijar.
             */}
            <Route
              path={ROUTES.RESET_PASSWORD}
              element={
                <PrivateRoute>
                  <ResetPassword />
                </PrivateRoute>
              }
            />

            {/*
             * SIN guarda, y es la única ruta del proyecto que lo está a
             * propósito. Una guarda sólo sabe que no hay sesión, y con eso no
             * puede distinguir «el proveedor falló» de «alguien escribió esta
             * dirección»: cuando Google devuelve un error no hay sesión, así que
             * `PrivateRoute` rebotaba a `/login` y borraba el motivo antes de
             * que la pantalla llegara a montarse. Los tres estados los resuelve
             * `AuthCallback`, y el de «sin sesión» sigue acabando en `/login`.
             *
             * `PrivateRoute` y `PublicRoute` no se tocan: ninguna de las dos
             * sabe nada de esta ruta.
             */}
            <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

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
