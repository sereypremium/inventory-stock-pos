import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import type { ReactNode } from 'react';
import { APP_ROUTES } from './routes';
import type { Role } from '../types/models';

export interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles?: Role[];
}

export const navigation_items: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: APP_ROUTES.dashboard,
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Brands',
    path: APP_ROUTES.brands,
    icon: <SellOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Categories',
    path: APP_ROUTES.categories,
    icon: <CategoryOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Products',
    path: APP_ROUTES.products,
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Suppliers',
    path: APP_ROUTES.suppliers,
    icon: <LocalShippingOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Stock In',
    path: APP_ROUTES.stock_in,
    icon: <WarehouseOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'POS',
    path: APP_ROUTES.pos,
    icon: <PointOfSaleOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Sales',
    path: APP_ROUTES.sales,
    icon: <ReceiptLongOutlinedIcon fontSize="small" />,
  },
  {
    label: 'Customers',
    path: APP_ROUTES.customers,
    icon: <GroupsOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Reports',
    path: APP_ROUTES.reports_daily_sales,
    icon: <SummarizeOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    path: APP_ROUTES.settings_shop,
    icon: <SettingsOutlinedIcon fontSize="small" />,
    roles: ['admin'],
  },
];

export const logo_icon = <SportsSoccerOutlinedIcon sx={{ fontSize: 18 }} />;
