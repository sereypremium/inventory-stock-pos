import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent?: string;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  accent = '#0f5b4f',
}: StatCardProps) {
  return (
    <Paper sx={{ height: '100%', p: 2.5, position: 'relative' }}>
      <Box
        sx={{
          background: accent,
          borderRadius: 999,
          height: 3,
          left: 24,
          position: 'absolute',
          right: 24,
          top: 0,
        }}
      />
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
          <Typography sx={{ mt: 1 }} variant="h5">
            {value}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: `${accent}14`,
            borderRadius: 2,
            color: accent,
            display: 'inline-flex',
            height: 42,
            justifyContent: 'center',
            width: 42,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}
