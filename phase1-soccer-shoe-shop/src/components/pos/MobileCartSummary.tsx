import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { format_currency, format_number } from '../../utils/formatters';

interface MobileCartSummaryProps {
  item_count: number;
  total_amount: number;
  currency?: string;
  on_open_cart: () => void;
  on_open_checkout: () => void;
}

export function MobileCartSummary({
  item_count,
  total_amount,
  currency = 'USD',
  on_open_cart,
  on_open_checkout,
}: MobileCartSummaryProps) {
  return (
    <Paper
      sx={{
        bottom: 12,
        left: 12,
        position: 'fixed',
        right: 12,
        zIndex: 1200,
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700 }} variant="body2">
            {format_number(item_count)} item(s)
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {format_currency(total_amount, currency)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={on_open_cart} startIcon={<ShoppingCartOutlinedIcon />} variant="outlined">
            Cart
          </Button>
          <Button onClick={on_open_checkout} startIcon={<PaymentsOutlinedIcon />} variant="contained">
            Checkout
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
