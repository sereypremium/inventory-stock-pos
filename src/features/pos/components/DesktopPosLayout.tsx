import type { ReactNode } from 'react';
import { Box, Stack } from '@mui/material';

interface DesktopPosLayoutProps {
  products: ReactNode;
  sidebar: ReactNode;
  summary?: ReactNode;
}

export function DesktopPosLayout({
  products,
  sidebar,
  summary,
}: DesktopPosLayoutProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(380px, 0.82fr)',
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>{products}</Box>

      <Stack
        spacing={2}
        sx={{
          minWidth: 0,
          position: 'sticky',
          top: 88,
        }}
      >
        {summary}
        {sidebar}
      </Stack>
    </Box>
  );
}
