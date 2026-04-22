import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate replace state={{ from: location }} to={APP_ROUTES.login} />;
  }

  return children;
}
