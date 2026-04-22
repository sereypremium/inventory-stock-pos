import type { ReactNode } from 'react';
import { Paper, Stack } from '@mui/material';

interface ReportFilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function ReportFilterBar({ children, actions }: ReportFilterBarProps) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
          {children}
        </Stack>
        {actions}
      </Stack>
    </Paper>
  );
}
