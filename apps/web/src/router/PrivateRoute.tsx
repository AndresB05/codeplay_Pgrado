import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { getHomeRouteForRole, isAuthenticated } from '../context/auth.helpers';
import { isGuestSession } from '../context/guest.helpers';
import { useActiveRole } from '../hooks/useActiveRole';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/user.types';

interface PrivateRouteProps {
  children: ReactNode;
  /**
   * Rol al que pertenece la ruta. Si el rol activo es otro, se redirige al
   * panel que le corresponde en lugar de mostrar un panel ajeno.
   */
  role?: UserRole;
}

export const PrivateRoute = ({ children, role }: PrivateRouteProps) => {
  const { loading, session } = useAuth();
  const activeRole = useActiveRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F3FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  // Mientras el login no está conectado, la sesión de invitado (solo en
  // desarrollo) hace las veces de sesión autenticada.
  if (!isAuthenticated(session) && !isGuestSession()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (role && activeRole && activeRole !== role) {
    return <Navigate to={getHomeRouteForRole(activeRole)} replace />;
  }

  return <>{children}</>;
};
