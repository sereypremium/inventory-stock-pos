import type { ReactNode } from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { AppShell } from '../components/app/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { BrandsPage } from '../features/brands/BrandsPage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PosPage } from '../features/pos/PosPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SaleDetailPage } from '../features/sales/SaleDetailPage';
import { SalesHistoryPage } from '../features/sales/SalesHistoryPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { StockInCreatePage } from '../features/stock-in/StockInCreatePage';
import { StockInDetailPage } from '../features/stock-in/StockInDetailPage';
import { StockInListPage } from '../features/stock-in/StockInListPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { UserManagementPage } from '../features/users/UserManagementPage';
import { ProductVariantsPage } from '../features/variants/ProductVariantsPage';
import type { Role } from '../types/models';

function AuthLoadingScreen() {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        minHeight: '100vh',
        p: 2,
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ maxWidth: 360, p: 3, width: '100%' }}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <CircularProgress size={30} />
          <Box>
            <Typography variant="h6">Checking secure session</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
              Loading your Supabase Auth session and profile.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthLoading, session } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthLoading, session } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const { session } = useAuth();

  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'brands',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <BrandsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <CategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <ProductsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'product-variants',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <ProductVariantsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <SuppliersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'stock-in',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <StockInListPage />
          </RoleGuard>
        ),
      },
      {
        path: 'stock-in/new',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <StockInCreatePage />
          </RoleGuard>
        ),
      },
      {
        path: 'stock-in/:stockInId',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <StockInDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'pos',
        element: (
          <RoleGuard allowedRoles={['admin', 'cashier']}>
            <PosPage />
          </RoleGuard>
        ),
      },
      {
        path: 'sales',
        element: (
          <RoleGuard allowedRoles={['admin', 'cashier']}>
            <SalesHistoryPage />
          </RoleGuard>
        ),
      },
      {
        path: 'sales/:saleId',
        element: (
          <RoleGuard allowedRoles={['admin', 'cashier']}>
            <SaleDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <ReportsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <UserManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
      { path: '*', element: <Navigate replace to="/dashboard" /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/login" />,
  },
]);
