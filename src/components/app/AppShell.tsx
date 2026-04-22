import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import {
  AppBar,
  Avatar,
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

const drawerWidth = 272;

function isActivePath(pathname: string, routePath: string) {
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { session, logout } = useAuth();
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
      <AppBar position="fixed">
        <Toolbar sx={{ gap: 1.5, minHeight: 72 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuOutlinedIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{activePage}</Typography>
            <Typography color="text.secondary" variant="body2">
              Soccer shoe shop back office
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
                  {session.name.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {session.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {session.email}
                  </Typography>
                </Box>
              </Stack>
              <IconButton
                onClick={() => {
                  logout();
                  navigate('/login');
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
        <Outlet />
      </Box>
    </Box>
  );
}
