import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';

interface CheckoutActionBarProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  onOpenCheckout: () => void;
}

export function CheckoutActionBar({
  itemCount,
  totalAmount,
  onOpenCart,
  onOpenCheckout,
}: CheckoutActionBarProps) {
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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.25}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontWeight: 700 }} variant="body2">
            {formatNumber(itemCount)} item(s)
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Grand total {formatCurrency(totalAmount)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            fullWidth
            onClick={onOpenCart}
            startIcon={<ShoppingCartOutlinedIcon />}
            variant="outlined"
          >
            Cart
          </Button>
          <Button
            fullWidth
            onClick={onOpenCheckout}
            startIcon={<PaymentsOutlinedIcon />}
            variant="contained"
          >
            Checkout
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
