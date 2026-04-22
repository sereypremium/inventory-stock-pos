import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';

export interface ReceiptLineItem {
  id: string;
  model_name: string;
  size: string;
  color: string;
  qty: number;
  sale_price: number;
  line_total: number;
}

interface ReceiptPrintProps {
  shop_name: string;
  address: string;
  phone: string;
  receipt_footer: string;
  currency?: string;
  sale_no: string;
  sale_date: string;
  cashier_name: string;
  customer_name?: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  items: ReceiptLineItem[];
}

export function ReceiptPrint({
  shop_name,
  address,
  phone,
  receipt_footer,
  currency = 'USD',
  sale_no,
  sale_date,
  cashier_name,
  customer_name,
  subtotal,
  discount_amount,
  total_amount,
  paid_amount,
  change_amount,
  items,
}: ReceiptPrintProps) {
  return (
    <Paper
      sx={{
        borderStyle: 'dashed',
        maxWidth: 420,
        p: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">{shop_name}</Typography>
          <Typography color="text.secondary" variant="caption">
            {address}
          </Typography>
          <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
            {phone}
          </Typography>
        </Box>

        <Divider />

        <Stack spacing={0.5}>
          <Typography variant="body2">Receipt No: {sale_no}</Typography>
          <Typography variant="body2">Date: {format_date_time(sale_date)}</Typography>
          <Typography variant="body2">Cashier: {cashier_name}</Typography>
          <Typography variant="body2">Customer: {customer_name || 'Walk-in'}</Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          {items.map((item) => (
            <Box key={item.id}>
              <Typography sx={{ fontWeight: 600 }} variant="body2">
                {item.model_name}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {item.size} / {item.color}
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="caption">
                  {format_number(item.qty)} x {format_currency(item.sale_price, currency)}
                </Typography>
                <Typography variant="caption">
                  {format_currency(item.line_total, currency)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>

        <Divider />

        <Stack spacing={0.5}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2">Subtotal</Typography>
            <Typography variant="body2">{format_currency(subtotal, currency)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2">Discount</Typography>
            <Typography variant="body2">{format_currency(discount_amount, currency)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              Grand Total
            </Typography>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {format_currency(total_amount, currency)}
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2">Paid</Typography>
            <Typography variant="body2">{format_currency(paid_amount, currency)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2">Change</Typography>
            <Typography variant="body2">{format_currency(change_amount, currency)}</Typography>
          </Stack>
        </Stack>

        <Divider />

        <Typography align="center" color="text.secondary" variant="caption">
          {receipt_footer}
        </Typography>
      </Stack>
    </Paper>
  );
}
