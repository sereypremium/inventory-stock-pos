import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types/models';

export function RoleGuard({
  allowed_roles,
  children,
}: {
  allowed_roles: Role[];
  children: ReactNode;
}) {
  const { session } = useAuth();

  if (!session || !allowed_roles.includes(session.role)) {
    return <Navigate replace to={APP_ROUTES.dashboard} />;
  }

  return children;
}
