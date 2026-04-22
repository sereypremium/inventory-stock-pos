import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigation_items } from '../../constants/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AppLogo } from './AppLogo';

function is_active_path(pathname: string, route_path: string) {
  return pathname === route_path || pathname.startsWith(`${route_path}/`);
}

export function Sidebar({ on_navigate }: { on_navigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const visible_navigation = navigation_items.filter(
    (item) => !item.roles || (session && item.roles.includes(session.role)),
  );

  return (
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
          {visible_navigation.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                on_navigate?.();
              }}
              selected={is_active_path(location.pathname, item.path)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box sx={{ mt: 'auto', px: 2.5, py: 2 }}>
        <Typography color="text.secondary" variant="caption">
          Practical small-shop stock and cashier workflow
        </Typography>
      </Box>
    </Stack>
  );
}
