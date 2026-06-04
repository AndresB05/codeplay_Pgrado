import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated } from '../context/auth.helpers';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F3FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  // Dev-only bypass: if we're in development and a local flag is set, allow access.
  const devBypass = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('dev:skipAuth') === '1';

  if (!isAuthenticated(session) && !devBypass) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};
