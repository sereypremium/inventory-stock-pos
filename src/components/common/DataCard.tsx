import type { ReactNode } from 'react';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';

interface DataCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DataCard({ title, description, actions, children }: DataCardProps) {
  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
        }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
              {description}
            </Typography>
          )}
        </Box>
        {actions}
      </Stack>
      <Divider />
      {children}
    </Paper>
  );
}
