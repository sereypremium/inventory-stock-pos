import { Box, Chip, Stack } from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import { formatCompactCurrency } from '../dashboardDisplay';
import type { DashboardAnalytics } from '../dashboardUtils';
import { DashboardBarChartCard } from './DashboardBarChartCard';
import { DashboardRankListCard } from './DashboardRankListCard';
import { DashboardSectionHeader } from './DashboardSectionHeader';

interface InventoryHealthSectionProps {
  analytics: Pick<
    DashboardAnalytics,
    'lowStockWatchlist' | 'outOfStockList' | 'highestStockItems' | 'stockValueByBrand'
  >;
}

export function InventoryHealthSection({
  analytics,
}: InventoryHealthSectionProps) {
  return (
    <Stack spacing={2}>
      <DashboardSectionHeader
        description="Variant-level stock pressure and stock value placement across brands, built for inventory action without clutter."
        title="Inventory Health"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <DashboardRankListCard
          description="The most urgent low-stock variants based on current stock against minimum target."
          emptyMessage="All variants are above their minimum stock threshold."
          items={analytics.lowStockWatchlist.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: `${formatNumber(item.stockQty)} / ${formatNumber(item.minStock)}`,
            chipLabel: 'Stock / Min',
            chipColor: item.stockQty === 0 ? 'error' : 'warning',
            valueColor: item.stockQty === 0 ? '#b42318' : '#b45a12',
          }))}
          title="Low Stock Watchlist"
        />
        <DashboardRankListCard
          description="Variants that can no longer be sold until a replenishment is received."
          emptyMessage="No variants are fully out of stock right now."
          items={analytics.outOfStockList.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: '0 on hand',
            chipLabel: `Min ${formatNumber(item.minStock)}`,
            chipColor: 'error',
            valueColor: '#b42318',
          }))}
          title="Out of Stock List"
        />
        <DashboardRankListCard
          description="Variants with the largest unit depth, useful for balancing stock and visibility."
          items={analytics.highestStockItems.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: item.sublabel,
            value: `${formatNumber(item.stockQty)} units`,
            chipLabel: formatCurrency(item.stockValue),
            chipColor: 'primary',
          }))}
          title="Highest Stock Items"
        />
        <DashboardBarChartCard
          actions={<Chip label="On-hand cost value" size="small" variant="outlined" />}
          data={analytics.stockValueByBrand.map((item) => ({
            label: item.label,
            value: item.value,
            displayValue: formatCompactCurrency(item.value),
            helper: `${formatNumber(item.stockUnits)} units`,
            color: '#4053d3',
          }))}
          description="Inventory value concentration by brand based on current stock and cost."
          emptyMessage="No brand stock values are available yet."
          title="Stock Value by Brand"
        />
      </Box>
    </Stack>
  );
}
