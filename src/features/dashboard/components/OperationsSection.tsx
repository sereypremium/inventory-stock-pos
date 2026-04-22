import { Box, Stack } from '@mui/material';
import { formatCurrency, formatNumber, formatPercent } from '../../../lib/formatters';
import type { DashboardAnalytics } from '../dashboardUtils';
import { DashboardRankListCard } from './DashboardRankListCard';
import { DashboardSectionHeader } from './DashboardSectionHeader';
import { RecentSalesCard } from './RecentSalesCard';

interface OperationsSectionProps {
  analytics: Pick<
    DashboardAnalytics,
    'recentSales' | 'salesByCashier' | 'paymentMethodSummary'
  >;
}

export function OperationsSection({ analytics }: OperationsSectionProps) {
  return (
    <Stack spacing={2}>
      <DashboardSectionHeader
        description="Cashier and payment visibility to support staffing, handoff, and daily counter operations."
        title="Operations"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.4fr 1fr 1fr' },
        }}
      >
        <RecentSalesCard sales={analytics.recentSales} />

        <DashboardRankListCard
          description="Cashier performance by net sales and transaction volume."
          items={analytics.salesByCashier.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: `Avg sale ${formatCurrency(item.averageSaleValue)}`,
            value: formatCurrency(item.revenue),
            progress:
              analytics.salesByCashier[0]?.revenue
                ? (item.revenue / analytics.salesByCashier[0].revenue) * 100
                : 0,
            chipLabel: `${formatNumber(item.transactions)} txns`,
            chipColor: 'primary',
          }))}
          title="Sales by Cashier"
        />

        <DashboardRankListCard
          description="Payment mix by value and transaction share for the current data set."
          items={analytics.paymentMethodSummary.map((item) => ({
            id: item.id,
            label: item.label,
            sublabel: `${formatNumber(item.transactions)} transactions`,
            value: formatCurrency(item.revenue),
            progress: item.share * 100,
            chipLabel: formatPercent(item.share),
            chipColor: 'default',
          }))}
          title="Payment Method Summary"
        />
      </Box>
    </Stack>
  );
}
