import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import type { ReactNode } from 'react';
import type { Role } from '../types/models';

export interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles?: Role[];
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Brands',
    path: '/brands',
    icon: <SellOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: <CategoryOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Products',
    path: '/products',
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Product Variants',
    path: '/product-variants',
    icon: <ViewInArOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: <LocalShippingOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Stock In',
    path: '/stock-in',
    icon: <MoveToInboxOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'POS',
    path: '/pos',
    icon: <PointOfSaleOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Sales History',
    path: '/sales',
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <AssessmentOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'User Management',
    path: '/users',
    icon: <ManageAccountsOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <SettingsOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
];

export const futureModules: string[] = [];

export const logoIcon = <SportsSoccerOutlinedIcon sx={{ fontSize: 18 }} />;
