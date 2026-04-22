import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (session) {
    return <Navigate replace to={APP_ROUTES.dashboard} />;
  }

  return children;
}
