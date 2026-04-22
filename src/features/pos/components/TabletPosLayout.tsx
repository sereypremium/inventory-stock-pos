import type { ReactNode } from 'react';
import { Drawer, Stack } from '@mui/material';

interface TabletPosLayoutProps {
  products: ReactNode;
  drawerContent: ReactNode;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  actionBar: ReactNode;
}

export function TabletPosLayout({
  products,
  drawerContent,
  drawerOpen,
  onCloseDrawer,
  actionBar,
}: TabletPosLayoutProps) {
  return (
    <>
      <Stack spacing={2}>{products}</Stack>

      <Drawer
        anchor="right"
        onClose={onCloseDrawer}
        open={drawerOpen}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: { sm: 480, xs: '100%' },
            },
          },
        }}
      >
        <Stack spacing={2}>{drawerContent}</Stack>
      </Drawer>

      {actionBar}
    </>
  );
}
