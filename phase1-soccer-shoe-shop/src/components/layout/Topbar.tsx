import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { AppBar, Avatar, Box, Chip, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';

function get_page_title(pathname: string) {
  if (matchPath(APP_ROUTES.product_new, pathname)) {
    return 'New Product';
  }

  if (matchPath('/app/products/:id/edit', pathname)) {
    return 'Edit Product';
  }

  if (matchPath('/app/products/:id/variants', pathname)) {
    return 'Product Variants';
  }

  if (matchPath(APP_ROUTES.products, pathname)) {
    return 'Products';
  }

  if (matchPath(APP_ROUTES.brands, pathname)) {
    return 'Brands';
  }

  if (matchPath(APP_ROUTES.categories, pathname)) {
    return 'Categories';
  }

  if (matchPath(APP_ROUTES.suppliers, pathname)) {
    return 'Suppliers';
  }

  if (matchPath(APP_ROUTES.stock_in_new, pathname)) {
    return 'New Stock In';
  }

  if (matchPath('/app/stock-in/:id', pathname)) {
    return 'Stock In Detail';
  }

  if (matchPath(APP_ROUTES.stock_in, pathname)) {
    return 'Stock In';
  }

  if (matchPath(APP_ROUTES.pos, pathname)) {
    return 'Point Of Sale';
  }

  if (matchPath('/app/sales/:id', pathname)) {
    return 'Sale Detail';
  }

  if (matchPath(APP_ROUTES.sales, pathname)) {
    return 'Sales History';
  }

  if (matchPath(APP_ROUTES.customers, pathname)) {
    return 'Customers';
  }

  if (matchPath(APP_ROUTES.reports_monthly_sales, pathname)) {
    return 'Monthly Sales Report';
  }

  if (matchPath(APP_ROUTES.reports_stock_balance, pathname)) {
    return 'Stock Balance Report';
  }

  if (matchPath(APP_ROUTES.reports_low_stock, pathname)) {
    return 'Low Stock Report';
  }

  if (matchPath(APP_ROUTES.reports_best_selling, pathname)) {
    return 'Best Selling Report';
  }

  if (matchPath(APP_ROUTES.reports_profit, pathname)) {
    return 'Profit Report';
  }

  if (matchPath(APP_ROUTES.reports_daily_sales, pathname)) {
    return 'Daily Sales Report';
  }

  if (matchPath(APP_ROUTES.settings_users, pathname)) {
    return 'User Management';
  }

  if (matchPath(APP_ROUTES.settings_shop, pathname)) {
    return 'Shop Settings';
  }

  return 'Dashboard';
}

export function Topbar({
  on_open_menu,
  show_menu_button,
}: {
  on_open_menu: () => void;
  show_menu_button: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  return (
    <AppBar position="fixed">
      <Toolbar sx={{ gap: 1.5, minHeight: 72 }}>
        {show_menu_button && (
          <IconButton edge="start" onClick={on_open_menu}>
            <MenuOutlinedIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{get_page_title(location.pathname)}</Typography>
          <Typography color="text.secondary" variant="body2">
            Practical daily operations for your soccer shoe shop
          </Typography>
        </Box>
        {session && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Chip
              color={session.role === 'admin' ? 'primary' : 'secondary'}
              label={session.role === 'admin' ? 'Admin' : 'Cashier'}
              size="small"
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', height: 34, width: 34 }}>
                {session.full_name.charAt(0)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography sx={{ fontWeight: 600 }} variant="body2">
                  {session.full_name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {session.email}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={() => {
                logout();
                navigate(APP_ROUTES.login);
              }}
            >
              <LogoutOutlinedIcon />
            </IconButton>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
