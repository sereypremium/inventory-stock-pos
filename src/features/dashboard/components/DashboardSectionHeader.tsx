import { Box, Typography } from '@mui/material';

interface DashboardSectionHeaderProps {
  title: string;
  description: string;
}

export function DashboardSectionHeader({
  title,
  description,
}: DashboardSectionHeaderProps) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 700 }} variant="h5">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
        {description}
      </Typography>
    </Box>
  );
}
