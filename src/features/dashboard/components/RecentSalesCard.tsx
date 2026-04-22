import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DataCard } from '../../../components/common/DataCard';
import { formatCurrency, formatDateTime, formatNumber } from '../../../lib/formatters';
import { getPaymentMethodColor, getPaymentMethodLabel } from '../dashboardDisplay';
import type { DashboardAnalytics } from '../dashboardUtils';

interface RecentSalesCardProps {
  sales: DashboardAnalytics['recentSales'];
}

export function RecentSalesCard({ sales }: RecentSalesCardProps) {
  return (
    <DataCard
      actions={
        <Button component={RouterLink} size="small" to="/sales">
          View all sales
        </Button>
      }
      description="Latest completed sales with cashier, payment method, and receipt total."
      title="Recent Sales"
    >
      <Stack divider={<Divider flexItem />} sx={{ px: 2.5 }}>
        {sales.length === 0 ? (
          <Box sx={{ py: 2.5 }}>
            <Typography color="text.secondary" variant="body2">
              No sales have been recorded yet.
            </Typography>
          </Box>
        ) : (
          sales.map((sale) => (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              key={sale.id}
              spacing={1.5}
              sx={{
                alignItems: { md: 'center' },
                justifyContent: 'space-between',
                py: 1.75,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {sale.receiptNo}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="caption">
                  {formatDateTime(sale.soldAt)} - {sale.cashierName}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: { xs: 'space-between', md: 'flex-end' },
                }}
              >
                <Chip
                  color={getPaymentMethodColor(sale.paymentMethod)}
                  label={getPaymentMethodLabel(sale.paymentMethod)}
                  size="small"
                  variant="outlined"
                />
                <Typography color="text.secondary" variant="caption">
                  {formatNumber(sale.totalQuantity)} items
                </Typography>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {formatCurrency(sale.total)}
                </Typography>
              </Stack>
            </Stack>
          ))
        )}
      </Stack>
    </DataCard>
  );
}
