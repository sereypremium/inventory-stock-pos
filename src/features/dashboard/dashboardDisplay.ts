import type { ChipProps } from '@mui/material';
import type { PaymentMethod } from '../../types/models';

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

export function formatCompactCurrency(value: number) {
  if (value === 0) {
    return '$0';
  }

  return compactCurrencyFormatter.format(value);
}

export function getPaymentMethodColor(paymentMethod: PaymentMethod): ChipProps['color'] {
  if (paymentMethod === 'cash') {
    return 'success';
  }

  if (paymentMethod === 'card') {
    return 'primary';
  }

  return 'default';
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod) {
  if (paymentMethod === 'cash') {
    return 'Cash';
  }

  if (paymentMethod === 'card') {
    return 'Card';
  }

  return 'Transfer';
}
