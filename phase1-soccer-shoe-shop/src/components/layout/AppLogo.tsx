import { Box, Stack, Typography } from '@mui/material';
import { APP_NAME, APP_SUBTITLE } from '../../constants/app';
import { logo_icon } from '../../constants/navigation';

export function AppLogo() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: 'primary.main',
          borderRadius: 2,
          color: 'primary.contrastText',
          display: 'inline-flex',
          height: 34,
          justifyContent: 'center',
          width: 34,
        }}
      >
        {logo_icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }} variant="subtitle1">
          {APP_NAME}
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.1 }} variant="caption">
          {APP_SUBTITLE}
        </Typography>
      </Box>
    </Stack>
  );
}
