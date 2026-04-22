import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DataCard } from '../../../components/common/DataCard';
import { formatCurrency } from '../../../lib/formatters';
import type { PaymentMethod } from '../../../types/models';
import { CartSummary } from './CartSummary';

const paymentOptions: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Transfer', value: 'transfer' },
];

interface PaymentPanelProps {
  customerName: string;
  paymentMethod: PaymentMethod;
  discountAmount: number;
  paidAmount: number;
  note: string;
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  totalAmount: number;
  changeAmount: number;
  canCheckout: boolean;
  shortAmount: number;
  checkoutTone: 'success' | 'warning' | 'error';
  checkoutMessage: string;
  onCustomerNameChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onDiscountAmountChange: (value: number) => void;
  onPaidAmountChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onUseExactAmount: () => void;
  onCheckout: () => void;
}

export function PaymentPanel({
  customerName,
  paymentMethod,
  discountAmount,
  paidAmount,
  note,
  lineCount,
  totalQuantity,
  subtotal,
  totalAmount,
  changeAmount,
  canCheckout,
  shortAmount,
  checkoutTone,
  checkoutMessage,
  onCustomerNameChange,
  onPaymentMethodChange,
  onDiscountAmountChange,
  onPaidAmountChange,
  onNoteChange,
  onUseExactAmount,
  onCheckout,
}: PaymentPanelProps) {
  const toneStyles = {
    error: {
      backgroundColor: 'rgba(180, 35, 24, 0.08)',
      borderColor: 'error.main',
      color: 'error.main',
    },
    success: {
      backgroundColor: 'rgba(32, 117, 74, 0.08)',
      borderColor: 'success.main',
      color: 'success.main',
    },
    warning: {
      backgroundColor: 'rgba(193, 123, 24, 0.1)',
      borderColor: 'warning.main',
      color: 'warning.main',
    },
  }[checkoutTone];

  return (
    <DataCard
      description="Review totals, capture payment, and finish the sale without leaving the current screen."
      title="Checkout"
    >
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();

          if (canCheckout) {
            onCheckout();
          }
        }}
      >
        <Stack spacing={2.25} sx={{ p: { xs: 2, md: 3 } }}>
          <CartSummary
            changeAmount={changeAmount}
            discountAmount={discountAmount}
            lineCount={lineCount}
            paidAmount={paidAmount}
            subtotal={subtotal}
            totalAmount={totalAmount}
            totalQuantity={totalQuantity}
          />

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <TextField
              label="Customer"
              onChange={(event) => onCustomerNameChange(event.target.value)}
              placeholder="Walk-in customer"
              size="small"
              value={customerName}
            />

            <TextField
              label="Payment method"
              onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
              select
              size="small"
              value={paymentMethod}
            >
              {paymentOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Discount"
              onChange={(event) => onDiscountAmountChange(Number(event.target.value) || 0)}
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              type="number"
              value={discountAmount}
            />

            <TextField
              helperText={
                paymentMethod === 'cash'
                  ? 'Press Enter to confirm once payment is enough.'
                  : 'Non-cash payments usually match the grand total.'
              }
              label="Paid amount"
              onChange={(event) => onPaidAmountChange(Number(event.target.value) || 0)}
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              type="number"
              value={paidAmount}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button onClick={onUseExactAmount} variant="outlined">
              Use Exact Amount
            </Button>
            <Button
              component={RouterLink}
              startIcon={<VisibilityOutlinedIcon />}
              to="/sales"
              variant="text"
            >
              Sales History
            </Button>
          </Stack>

          <TextField
            label="Note"
            minRows={2}
            multiline
            onChange={(event) => onNoteChange(event.target.value)}
            size="small"
            value={note}
          />

          <Box
            sx={{
              backgroundColor: toneStyles.backgroundColor,
              border: '1px solid',
              borderColor: toneStyles.borderColor,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <Typography sx={{ color: toneStyles.color, fontWeight: 700 }} variant="body2">
              {checkoutMessage}
            </Typography>
            {shortAmount > 0 && (
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                Collect {formatCurrency(shortAmount)} more to complete the sale.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              bottom: 0,
              mt: 0.5,
              position: 'sticky',
              pt: 1.5,
            }}
          >
            <Button
              disabled={!canCheckout}
              size="large"
              startIcon={<LocalAtmOutlinedIcon />}
              sx={{ minHeight: 52, width: '100%' }}
              type="submit"
              variant="contained"
            >
              Confirm Sale
            </Button>
          </Box>
        </Stack>
      </Box>
    </DataCard>
  );
}
