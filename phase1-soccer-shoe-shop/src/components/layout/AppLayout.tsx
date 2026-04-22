import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Box, Divider, Drawer, IconButton, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppLogo } from './AppLogo';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const drawer_width = 272;

export function AppLayout() {
  const theme = useTheme();
  const is_desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobile_open, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar
        on_open_menu={() => setMobileOpen(true)}
        show_menu_button={!is_desktop}
      />

      {is_desktop ? (
        <Drawer
          open
          sx={{
            flexShrink: 0,
            width: drawer_width,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawer_width,
            },
          }}
          variant="permanent"
        >
          <Toolbar sx={{ minHeight: 72 }} />
          <Sidebar />
        </Drawer>
      ) : (
        <Drawer
          onClose={() => setMobileOpen(false)}
          open={mobile_open}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawer_width,
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
          <Sidebar on_navigate={() => setMobileOpen(false)} />
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
