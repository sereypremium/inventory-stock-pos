import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            {description}
          </Typography>
        </Box>
        {action}
      </Stack>
    </Paper>
  );
}
