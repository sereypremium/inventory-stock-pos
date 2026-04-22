import { Box, Chip, Stack, Typography } from '@mui/material';
import { DataCard } from '../../../components/common/DataCard';
import { formatCurrency, formatNumber, formatPercent } from '../../../lib/formatters';
import type { DashboardAnalytics } from '../dashboardUtils';

interface ProfitSummaryCardProps {
  currentMonthLabel: string;
  summary: DashboardAnalytics['businessSummary'];
}

export function ProfitSummaryCard({
  currentMonthLabel,
  summary,
}: ProfitSummaryCardProps) {
  const metricCards = [
    {
      label: 'Revenue',
      value: formatCurrency(summary.revenue),
      helper: 'Net sales after discount',
    },
    {
      label: 'Cost',
      value: formatCurrency(summary.cost),
      helper: 'Estimated product cost sold',
    },
    {
      label: 'Profit Margin',
      value: formatPercent(summary.profitMargin),
      helper: 'Profit as a share of revenue',
    },
    {
      label: 'Average Sale Value',
      value: formatCurrency(summary.averageSaleValue),
      helper: 'Average receipt total',
    },
  ];

  return (
    <DataCard
      actions={
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip
            color={summary.profit >= 0 ? 'success' : 'error'}
            label={`Margin ${formatPercent(summary.profitMargin)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            color="primary"
            label={`${formatNumber(summary.transactions)} transactions`}
            size="small"
            variant="outlined"
          />
        </Stack>
      }
      description={`Compact owner summary for ${currentMonthLabel}.`}
      title="Profit and Business Summary"
    >
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.95fr) minmax(0, 1.25fr)' },
          p: 2.5,
        }}
      >
        <Box
          sx={{
            backgroundColor:
              summary.profit >= 0 ? 'rgba(15, 91, 79, 0.05)' : 'rgba(180, 35, 24, 0.05)',
            border: '1px solid',
            borderColor:
              summary.profit >= 0 ? 'rgba(15, 91, 79, 0.18)' : 'rgba(180, 35, 24, 0.18)',
            borderRadius: 2,
            p: 2.25,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Profit
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 700 }} variant="h4">
            {formatCurrency(summary.profit)}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">
            Revenue minus product cost for the current month, with margin kept visible for fast
            owner decisions.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {metricCards.map((metric) => (
            <Box
              key={metric.label}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography color="text.secondary" variant="body2">
                {metric.label}
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 700 }} variant="h6">
                {metric.value}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }} variant="caption">
                {metric.helper}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </DataCard>
  );
}
