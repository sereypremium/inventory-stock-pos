import type { ReactNode } from 'react';
import type { ChipProps } from '@mui/material';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { DataCard } from '../../../components/common/DataCard';

export interface DashboardRankListItem {
  id: string;
  label: string;
  sublabel?: string;
  value: string;
  progress?: number;
  chipLabel?: string;
  chipColor?: ChipProps['color'];
  valueColor?: string;
}

interface DashboardRankListCardProps {
  title: string;
  description: string;
  items: DashboardRankListItem[];
  actions?: ReactNode;
  emptyMessage?: string;
}

export function DashboardRankListCard({
  title,
  description,
  items,
  actions,
  emptyMessage = 'No rows are available yet.',
}: DashboardRankListCardProps) {
  return (
    <DataCard actions={actions} description={description} title={title}>
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            {emptyMessage}
          </Typography>
        ) : (
          items.map((item) => (
            <Box
              key={item.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {item.label}
                  </Typography>
                  {item.sublabel && (
                    <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="caption">
                      {item.sublabel}
                    </Typography>
                  )}
                </Box>
                <Stack spacing={0.6} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  {item.chipLabel && (
                    <Chip
                      color={item.chipColor}
                      label={item.chipLabel}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Typography sx={{ color: item.valueColor, fontWeight: 700 }} variant="body2">
                    {item.value}
                  </Typography>
                </Stack>
              </Stack>

              {typeof item.progress === 'number' && (
                <Box
                  sx={{
                    backgroundColor: 'rgba(15, 91, 79, 0.08)',
                    borderRadius: 999,
                    height: 6,
                    mt: 1.2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#0f5b4f',
                      borderRadius: 999,
                      height: '100%',
                      width: `${Math.max(Math.min(item.progress, 100), 0)}%`,
                    }}
                  />
                </Box>
              )}
            </Box>
          ))
        )}
      </Stack>
    </DataCard>
  );
}
