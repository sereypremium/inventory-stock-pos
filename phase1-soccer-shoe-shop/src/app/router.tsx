import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { GuestOnlyRoute } from './GuestOnlyRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { APP_ROUTES } from '../constants/routes';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { BrandPage } from '../pages/brands/BrandPage';
import { CategoryPage } from '../pages/categories/CategoryPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { POSPage } from '../pages/pos/POSPage';
import { ProductCreatePage } from '../pages/products/ProductCreatePage';
import { ProductEditPage } from '../pages/products/ProductEditPage';
import { ProductListPage } from '../pages/products/ProductListPage';
import { ProductVariantsPage } from '../pages/products/ProductVariantsPage';
import { BestSellingReportPage } from '../pages/reports/BestSellingReportPage';
import { DailySalesReportPage } from '../pages/reports/DailySalesReportPage';
import { LowStockReportPage } from '../pages/reports/LowStockReportPage';
import { MonthlySalesReportPage } from '../pages/reports/MonthlySalesReportPage';
import { ProfitReportPage } from '../pages/reports/ProfitReportPage';
import { StockBalanceReportPage } from '../pages/reports/StockBalanceReportPage';
import { SalesDetailPage } from '../pages/sales/SalesDetailPage';
import { SalesHistoryPage } from '../pages/sales/SalesHistoryPage';
import { ShopSettingsPage } from '../pages/settings/ShopSettingsPage';
import { UserManagementPage } from '../pages/settings/UserManagementPage';
import { StockInCreatePage } from '../pages/stockIn/StockInCreatePage';
import { StockInDetailPage } from '../pages/stockIn/StockInDetailPage';
import { StockInListPage } from '../pages/stockIn/StockInListPage';
import { SuppliersPage } from '../pages/suppliers/SuppliersPage';

function admin_only(children: ReactNode) {
  return <RoleGuard allowed_roles={['admin']}>{children}</RoleGuard>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to={APP_ROUTES.login} />,
  },
  {
    path: APP_ROUTES.login,
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: APP_ROUTES.app,
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate replace to={APP_ROUTES.dashboard} /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'brands', element: admin_only(<BrandPage />) },
      { path: 'categories', element: admin_only(<CategoryPage />) },
      {
        path: 'products',
        children: [
          { index: true, element: admin_only(<ProductListPage />) },
          { path: 'new', element: admin_only(<ProductCreatePage />) },
          { path: ':id/edit', element: admin_only(<ProductEditPage />) },
          { path: ':id/variants', element: admin_only(<ProductVariantsPage />) },
        ],
      },
      { path: 'suppliers', element: admin_only(<SuppliersPage />) },
      {
        path: 'stock-in',
        children: [
          { index: true, element: admin_only(<StockInListPage />) },
          { path: 'new', element: admin_only(<StockInCreatePage />) },
          { path: ':id', element: admin_only(<StockInDetailPage />) },
        ],
      },
      { path: 'pos', element: <POSPage /> },
      {
        path: 'sales',
        children: [
          { index: true, element: <SalesHistoryPage /> },
          { path: ':id', element: <SalesDetailPage /> },
        ],
      },
      { path: 'customers', element: admin_only(<CustomersPage />) },
      {
        path: 'reports',
        children: [
          { path: 'daily-sales', element: admin_only(<DailySalesReportPage />) },
          { path: 'monthly-sales', element: admin_only(<MonthlySalesReportPage />) },
          { path: 'stock-balance', element: admin_only(<StockBalanceReportPage />) },
          { path: 'low-stock', element: admin_only(<LowStockReportPage />) },
          { path: 'best-selling', element: admin_only(<BestSellingReportPage />) },
          { path: 'profit', element: admin_only(<ProfitReportPage />) },
        ],
      },
      {
        path: 'settings',
        children: [
          { path: 'shop', element: admin_only(<ShopSettingsPage />) },
          { path: 'users', element: admin_only(<UserManagementPage />) },
        ],
      },
      { path: '*', element: <Navigate replace to={APP_ROUTES.dashboard} /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to={APP_ROUTES.login} />,
  },
]);
