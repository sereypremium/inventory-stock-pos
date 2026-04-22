import { Box, Chip, Stack } from '@mui/material';
import { formatCompactCurrency } from '../dashboardDisplay';
import type { DashboardAnalytics } from '../dashboardUtils';
import { DashboardBarChartCard } from './DashboardBarChartCard';
import { DashboardSectionHeader } from './DashboardSectionHeader';

interface SalesTrendSectionProps {
  analytics: Pick<
    DashboardAnalytics,
    'dailySalesTrend' | 'weeklySalesSummary' | 'monthlySalesSummary'
  >;
}

export function SalesTrendSection({ analytics }: SalesTrendSectionProps) {
  return (
    <Stack spacing={2}>
      <DashboardSectionHeader
        description="Simple trend views for short-term selling pace and bigger weekly and monthly movement."
        title="Sales Trend"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <DashboardBarChartCard
          actions={<Chip label="Last 14 days" size="small" variant="outlined" />}
          data={analytics.dailySalesTrend.map((point) => ({
            label: point.label,
            value: point.value,
            displayValue: formatCompactCurrency(point.value),
            helper: `${point.transactionCount} txns`,
          }))}
          description="Net sales value by day to spot short-term momentum and quiet trading days."
          title="Daily Sales Trend"
        />
        <DashboardBarChartCard
          actions={<Chip label="Last 8 weeks" size="small" variant="outlined" />}
          data={analytics.weeklySalesSummary.map((point) => ({
            label: point.label,
            value: point.value,
            displayValue: formatCompactCurrency(point.value),
            helper: `${point.transactionCount} txns`,
            color: '#2f6fcb',
          }))}
          description="Weekly roll-up for manager pacing, staffing, and replenishment planning."
          title="Weekly Sales Summary"
        />
        <DashboardBarChartCard
          actions={<Chip label="Last 6 months" size="small" variant="outlined" />}
          data={analytics.monthlySalesSummary.map((point) => ({
            label: point.label,
            value: point.value,
            displayValue: formatCompactCurrency(point.value),
            helper: `${point.transactionCount} txns`,
            color: '#ea6a1f',
          }))}
          description="Monthly summary for bigger seasonal movement and business direction."
          title="Monthly Sales Summary"
        />
      </Box>
    </Stack>
  );
}
