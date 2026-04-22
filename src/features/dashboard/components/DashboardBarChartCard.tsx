import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { DataCard } from '../../../components/common/DataCard';

export interface DashboardChartPoint {
  label: string;
  value: number;
  displayValue: string;
  helper?: string;
  color?: string;
}

interface DashboardBarChartCardProps {
  title: string;
  description: string;
  data: DashboardChartPoint[];
  actions?: ReactNode;
  accent?: string;
  emptyMessage?: string;
}

export function DashboardBarChartCard({
  title,
  description,
  data,
  actions,
  accent = '#0f5b4f',
  emptyMessage = 'No chart data is available yet.',
}: DashboardBarChartCardProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <DataCard actions={actions} description={description} title={title}>
      {data.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" variant="body2">
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto', px: 2.5, py: 2.5 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: `repeat(${data.length}, minmax(56px, 1fr))`,
              minWidth: Math.max(data.length * 72, 320),
            }}
          >
            {data.map((item) => {
              const barHeight =
                maxValue > 0 ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0) : 0;

              return (
                <Stack key={item.label} spacing={0.9} sx={{ alignItems: 'stretch' }}>
                  <Typography sx={{ fontWeight: 700, textAlign: 'center' }} variant="caption">
                    {item.displayValue}
                  </Typography>
                  <Box
                    sx={{
                      alignItems: 'flex-end',
                      backgroundColor: 'rgba(15, 91, 79, 0.05)',
                      borderRadius: 2,
                      display: 'flex',
                      height: 144,
                      overflow: 'hidden',
                      p: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: item.color ?? accent,
                        borderRadius: 1.5,
                        height: `${barHeight}%`,
                        transition: 'height 180ms ease',
                        width: '100%',
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontWeight: 700, textAlign: 'center' }} variant="body2">
                    {item.label}
                  </Typography>
                  <Typography color="text.secondary" sx={{ textAlign: 'center' }} variant="caption">
                    {item.helper ?? '\u00A0'}
                  </Typography>
                </Stack>
              );
            })}
          </Box>
        </Box>
      )}
    </DataCard>
  );
}
