import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { DataCard } from '../../../components/common/DataCard';
import { formatNumber } from '../../../lib/formatters';
import type { PosCartDetail } from '../types';
import { CartItemRow } from './CartItemRow';

interface CartPanelProps {
  items: PosCartDetail[];
  totalQuantity: number;
  maxHeight?: number | string;
  onClearCart?: () => void;
  onIncrease: (variantId: string) => void;
  onDecrease: (variantId: string) => void;
  onRemove: (variantId: string) => void;
}

export function CartPanel({
  items,
  totalQuantity,
  maxHeight,
  onClearCart,
  onIncrease,
  onDecrease,
  onRemove,
}: CartPanelProps) {
  return (
    <DataCard
      actions={
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            icon={<ShoppingCartOutlinedIcon fontSize="small" />}
            label={`${formatNumber(totalQuantity)} units`}
            size="small"
            variant="outlined"
          />
          {items.length > 0 && onClearCart && (
            <Button
              color="inherit"
              onClick={onClearCart}
              size="small"
              startIcon={<DeleteSweepOutlinedIcon />}
              variant="outlined"
            >
              Clear Cart
            </Button>
          )}
        </Stack>
      }
      description="Cart quantities stay locked to variant-level stock so the cashier can update lines without overselling."
      title="Cart"
    >
      <Stack
        spacing={1.5}
        sx={{
          maxHeight,
          overflowY: maxHeight ? 'auto' : 'visible',
          p: { xs: 2, md: 3 },
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              Cart is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
              Choose a product, pick the variant, and it will appear here for quick checkout.
            </Typography>
          </Box>
        ) : (
          items.map((item) => (
            <CartItemRow
              item={item}
              key={item.id}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              onRemove={onRemove}
            />
          ))
        )}
      </Stack>
    </DataCard>
  );
}
