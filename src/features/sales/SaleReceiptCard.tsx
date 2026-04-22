import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/formatters';
import { formatPaymentMethod } from '../../services/receiptPrint';
import { getSaleDiscountAmount, getSaleGrandTotal } from '../../services/salesService';
import type { SaleRecord } from '../../types/models';

export function SaleReceiptCard({ sale }: { sale: SaleRecord }) {
  const { settings } = useAuth();
  const discountAmount = getSaleDiscountAmount(sale);
  const grandTotal = getSaleGrandTotal(sale);

  return (
    <Paper
      sx={{
        backgroundColor: '#fff',
        borderStyle: 'dashed',
        fontFamily: 'Consolas, "Courier New", monospace',
        maxWidth: 360,
        p: 2.5,
        width: '100%',
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }} variant="body1">
            {settings.storeName}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {settings.branchName}
          </Typography>
          <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
            {settings.address}
          </Typography>
          <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
            {settings.phone}
          </Typography>
          <Typography sx={{ display: 'block', mt: 0.75 }} variant="body2">
            {sale.receiptNo}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Typography variant="caption">Date: {formatDateTime(sale.soldAt)}</Typography>
        <Typography variant="caption">Cashier: {sale.cashierName}</Typography>
        {sale.customerName && <Typography variant="caption">Customer: {sale.customerName}</Typography>}
        <Typography variant="caption">
          Payment: {formatPaymentMethod(sale.paymentMethod)}
        </Typography>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack spacing={1.25}>
          {sale.items.map((item) => (
            <Box key={item.id}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ fontWeight: 700 }} variant="caption">
                  {item.productName}
                </Typography>
                <Typography sx={{ fontWeight: 700 }} variant="caption">
                  {formatCurrency(item.lineTotal)}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="caption">
                {item.variantSku} | {item.size} / {item.color}
              </Typography>
              <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
                {formatNumber(item.quantity)} x {formatCurrency(item.unitPrice)}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            backgroundColor: 'rgba(15, 91, 79, 0.05)',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.25,
          }}
        >
          <ReceiptSummaryRow label="Items" value={formatNumber(sale.totalQuantity)} />
          <ReceiptSummaryRow label="Subtotal" value={formatCurrency(sale.subtotal)} />
          {discountAmount > 0 && (
            <ReceiptSummaryRow label="Discount" value={formatCurrency(discountAmount)} />
          )}
          <ReceiptSummaryRow emphasized label="Total" value={formatCurrency(grandTotal)} />
          <ReceiptSummaryRow label="Paid" value={formatCurrency(sale.paidAmount)} />
          <ReceiptSummaryRow label="Change" value={formatCurrency(sale.changeAmount)} />
        </Box>

        {sale.note && (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Typography color="text.secondary" variant="caption">
              Note: {sale.note}
            </Typography>
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Typography color="text.secondary" sx={{ textAlign: 'center' }} variant="caption">
          {settings.receiptFooter}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ReceiptSummaryRow({
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
        display: 'flex',
        gap: 1,
        justifyContent: 'space-between',
      }}
    >
      <Typography sx={{ fontWeight: emphasized ? 700 : 400 }} variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: emphasized ? 700 : 400 }} variant="caption">
        {value}
      </Typography>
    </Box>
  );
}
