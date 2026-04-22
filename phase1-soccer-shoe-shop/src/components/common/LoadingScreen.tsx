import { Box, CircularProgress, Stack, Typography } from '@mui/material';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary" variant="body2">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
