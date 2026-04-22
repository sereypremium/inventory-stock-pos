import { Box, Stack } from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { DashboardAnalytics } from '../dashboardUtils';
import { DashboardRankListCard } from './DashboardRankListCard';
import { DashboardSectionHeader } from './DashboardSectionHeader';

interface ProductPerformanceSectionProps {
  analytics: Pick<
    DashboardAnalytics,
    'topSellingProducts' | 'topSellingBrands' | 'slowMovingProducts' | 'outOfStockProducts'
  >;
}

export function ProductPerformanceSection({
  analytics,
}: ProductPerformanceSectionProps) {
  return (
    <Stack spacing={2}>
      <DashboardSectionHeader
        description="Fast product and brand signals that help identify what is driving the day and what needs attention."
        title="Product Performance"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <DashboardRankListCard
          description="Best-selling products ranked by sales volume, with revenue shown alongside."
          items={analytics.topSellingProducts.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: formatCurrency(item.value),
            progress: item.progress,
            chipLabel: item.chipLabel,
            chipColor: 'success',
          }))}
          title="Top Selling Products"
        />
        <DashboardRankListCard
          description="Brand leaders based on recent sales revenue and item movement."
          items={analytics.topSellingBrands.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: formatCurrency(item.value),
            progress: item.progress,
            chipLabel: item.chipLabel,
            chipColor: 'primary',
          }))}
          title="Top Selling Brands"
        />
        <DashboardRankListCard
          description="Products with the lowest last-30-day movement, useful for markdown and replenishment decisions."
          items={analytics.slowMovingProducts.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: `${formatNumber(item.value)} sold`,
            progress: item.progress,
            chipLabel: item.chipLabel,
            chipColor: item.value === 0 ? 'warning' : 'default',
            valueColor: item.value === 0 ? '#b45a12' : undefined,
          }))}
          title="Slow Moving Products"
        />
        <DashboardRankListCard
          description="Products with no stock left across their tracked variants."
          emptyMessage="No products are fully out of stock right now."
          items={analytics.outOfStockProducts.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: `${formatNumber(item.quantity)} variants`,
            progress: item.progress,
            chipLabel: item.chipLabel,
            chipColor: 'error',
            valueColor: '#b42318',
          }))}
          title="Out of Stock Products"
        />
      </Box>
    </Stack>
  );
}
