import { Box, Divider, Stack, Typography } from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';

interface CartSummaryProps {
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
}

export function CartSummary({
  lineCount,
  totalQuantity,
  subtotal,
  discountAmount,
  totalAmount,
  paidAmount,
  changeAmount,
}: CartSummaryProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
      }}
    >
      <Typography color="text.secondary" sx={{ mb: 1.25 }} variant="caption">
        Totals
      </Typography>
      <SummaryRow label="Cart lines" value={formatNumber(lineCount)} />
      <SummaryRow label="Units" value={formatNumber(totalQuantity)} />
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
      <SummaryRow label="Discount" value={formatCurrency(discountAmount)} />
      <Divider sx={{ my: 1.5 }} />
      <Box
        sx={{
          backgroundColor: 'primary.main',
          borderRadius: 2,
          color: 'common.white',
          p: 1.75,
        }}
      >
        <Typography sx={{ opacity: 0.82 }} variant="caption">
          Grand total
        </Typography>
        <Typography sx={{ fontWeight: 700, mt: 0.35 }} variant="h4">
          {formatCurrency(totalAmount)}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          <AmountMetric label="Paid" value={formatCurrency(paidAmount)} />
          <AmountMetric label="Change" value={formatCurrency(changeAmount)} />
        </Stack>
      </Box>
    </Box>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.45,
      }}
    >
      <Typography color={emphasized ? 'text.primary' : 'text.secondary'} variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: emphasized ? 700 : 600 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}

function AmountMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ opacity: 0.78 }} variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.25 }} variant="body1">
        {value}
      </Typography>
    </Box>
  );
}
