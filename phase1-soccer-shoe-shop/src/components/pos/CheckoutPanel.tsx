import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import { Button, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DataCard } from '../common/DataCard';
import type { Customer, PaymentMethod } from '../../types/models';
import { format_currency } from '../../utils/formatters';

interface CheckoutPanelProps {
  customers: Customer[];
  customer_id: string;
  payment_method: PaymentMethod;
  discount_amount: number;
  paid_amount: number;
  notes: string;
  subtotal: number;
  total_amount: number;
  change_amount: number;
  cart_count: number;
  is_checkout_disabled?: boolean;
  currency?: string;
  on_customer_change: (value: string) => void;
  on_payment_method_change: (value: PaymentMethod) => void;
  on_discount_change: (value: number) => void;
  on_paid_amount_change: (value: number) => void;
  on_notes_change: (value: string) => void;
  on_checkout: () => void;
}

export function CheckoutPanel({
  customers,
  customer_id,
  payment_method,
  discount_amount,
  paid_amount,
  notes,
  subtotal,
  total_amount,
  change_amount,
  cart_count,
  is_checkout_disabled = false,
  currency = 'USD',
  on_customer_change,
  on_payment_method_change,
  on_discount_change,
  on_paid_amount_change,
  on_notes_change,
  on_checkout,
}: CheckoutPanelProps) {
  return (
    <DataCard
      description="The payment panel stays compact so the cashier can review totals and complete checkout quickly."
      title="Payment"
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <TextField
          label="Customer"
          onChange={(event) => on_customer_change(event.target.value)}
          select
          size="small"
          value={customer_id}
        >
          <MenuItem value="">Walk-in</MenuItem>
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Payment method"
          onChange={(event) => on_payment_method_change(event.target.value as PaymentMethod)}
          select
          size="small"
          value={payment_method}
        >
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="card">Card</MenuItem>
          <MenuItem value="transfer">Transfer</MenuItem>
          <MenuItem value="e_wallet">E-Wallet</MenuItem>
        </TextField>

        <TextField
          label="Discount"
          onChange={(event) => on_discount_change(Number(event.target.value) || 0)}
          size="small"
          slotProps={{ htmlInput: { min: 0 } }}
          type="number"
          value={discount_amount}
        />

        <TextField
          autoFocus
          label="Paid amount"
          onChange={(event) => on_paid_amount_change(Number(event.target.value) || 0)}
          size="small"
          slotProps={{ htmlInput: { min: 0 } }}
          type="number"
          value={paid_amount}
        />

        <TextField
          label="Notes"
          minRows={2}
          multiline
          onChange={(event) => on_notes_change(event.target.value)}
          size="small"
          value={notes}
        />

        <Divider />

        <Stack spacing={1.1}>
          <SummaryRow label="Items in cart" value={String(cart_count)} />
          <SummaryRow label="Subtotal" value={format_currency(subtotal, currency)} />
          <SummaryRow label="Discount" value={format_currency(discount_amount, currency)} />
          <SummaryRow label="Grand total" strong value={format_currency(total_amount, currency)} />
          <SummaryRow label="Paid" value={format_currency(paid_amount, currency)} />
          <SummaryRow label="Change" strong value={format_currency(change_amount, currency)} />
        </Stack>

        <Button
          disabled={is_checkout_disabled}
          onClick={on_checkout}
          size="large"
          startIcon={<LocalAtmOutlinedIcon />}
          variant="contained"
        >
          Confirm Checkout
        </Button>
      </Stack>
    </DataCard>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography color={strong ? 'text.primary' : 'text.secondary'} variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: strong ? 700 : 600 }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}
