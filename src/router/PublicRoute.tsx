import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { isAuthenticated } from '../context/auth.helpers';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F3FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  if (isAuthenticated(session)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
