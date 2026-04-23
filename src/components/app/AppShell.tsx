import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import {
  Alert,
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AppLogo } from './AppLogo';
import { futureModules, navigationItems } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { isSupabaseConfigured } from '../../lib/supabase';

const drawerWidth = 272;

function isActivePath(pathname: string, routePath: string) {
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { authError, session, logout } = useAuth();
  const { isDatabaseConnected, isSyncing } = useInventory();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavigation = navigationItems.filter(
    (item) => !item.roles || (session && item.roles.includes(session.role)),
  );
  const activePage =
    navigationItems.find((item) => isActivePath(location.pathname, item.path))?.label ??
    'Dashboard';

  const drawerContent = (
    <Stack sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2 }}>
        <AppLogo />
      </Box>
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Typography color="text.secondary" sx={{ px: 1, pb: 1 }} variant="caption">
          Modules
        </Typography>
        <List disablePadding>
          {visibleNavigation.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={isActivePath(location.pathname, item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      {futureModules.length > 0 && (
        <Box sx={{ mt: 'auto', px: 2.5, py: 2 }}>
          <Typography color="text.secondary" gutterBottom variant="caption">
            Next phases
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {futureModules.map((module) => (
              <Chip key={module} label={module} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 1, sm: 1.5 },
            minHeight: { xs: 64, md: 72 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ flexShrink: 0 }}>
              <MenuOutlinedIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, lineHeight: 1.25 }} variant="h6">
              {activePage}
            </Typography>
            <Typography
              color="text.secondary"
              noWrap
              sx={{ display: { xs: 'none', sm: 'block' } }}
              variant="body2"
            >
              Soccer shoe shop back office
            </Typography>
          </Box>
          {session && (
            <Stack direction="row" sx={{ alignItems: 'center', flexShrink: 0 }}>
              <IconButton
                aria-label="Log out"
                onClick={() => {
                  void logout();
                  navigate('/login');
                }}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              >
                <LogoutOutlinedIcon />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          open
          sx={{
            flexShrink: 0,
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          variant="permanent"
        >
          <Toolbar sx={{ minHeight: 72 }} />
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          variant="temporary"
        >
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
            }}
          >
            <AppLogo />
            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          <Divider />
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, md: 3 },
          py: { xs: 11, md: 12 },
        }}
      >
        {authError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}
        {!isDatabaseConnected && !isSyncing && (
          <Alert severity={isSupabaseConfigured ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {isSupabaseConfigured
              ? 'Supabase is configured but live inventory data could not sync under the current session and RLS policies.'
              : 'Supabase env vars are missing in this app runtime. The current screen is using mock/browser data, so it will not match empty tables in Supabase until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.'}
          </Alert>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
