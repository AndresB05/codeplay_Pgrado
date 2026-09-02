import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, resolveLandingRoute } from '../context/auth.helpers';
import { useActiveRole } from '../hooks/useActiveRole';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { loading, session } = useAuth();
  const activeRole = useActiveRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F3FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  /*
   * Aparta sólo a quien además tiene rol. Con sesión y sin rol, `PrivateRoute`
   * manda a `/login`, y devolverlo aquí a `getHomeRouteForRole(null)` —que es
   * `/dashboard/worlds`, una ruta de niño— cerraría un bucle entre las dos
   * guardas. Se ajustan a la vez o ninguna.
   *
   * `PrivateRoute` NO decide destino, sólo corta: manda a `/login` a quien no
   * puede pasar. La que elige a dónde va alguien recién autenticado es ésta, y
   * por eso el resolutor de aterrizaje se llama desde aquí.
   */
  if (isAuthenticated(session) && activeRole) {
    return <Navigate to={resolveLandingRoute(activeRole)} replace />;
  }

  return <>{children}</>;
};
