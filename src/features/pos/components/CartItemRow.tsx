import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { StockChip } from '../../../components/common/StockChip';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { PosCartDetail } from '../types';

interface CartItemRowProps {
  item: PosCartDetail;
  onIncrease: (variantId: string) => void;
  onDecrease: (variantId: string) => void;
  onRemove: (variantId: string) => void;
}

export function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const remainingStock = Math.max(item.variant.stockQty - item.quantity, 0);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {item.product.name}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {item.variant.sku} | {item.variant.size} / {item.variant.color}
            </Typography>
            {item.variant.barcode && (
              <Typography color="text.secondary" sx={{ display: 'block' }} variant="caption">
                Barcode: {item.variant.barcode}
              </Typography>
            )}
          </Box>
          <IconButton color="error" onClick={() => onRemove(item.variant.id)}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography color="text.secondary" variant="caption">
            Unit {formatCurrency(item.variant.sellingPrice)}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Line {formatCurrency(item.lineTotal)}
          </Typography>
        </Stack>

        <Stack
          direction={isPhone ? 'column' : 'row'}
          spacing={1.25}
          sx={{ justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() => onDecrease(item.variant.id)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <RemoveOutlinedIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }} variant="body2">
              {formatNumber(item.quantity)}
            </Typography>
            <IconButton
              disabled={item.quantity >= item.variant.stockQty}
              onClick={() => onIncrease(item.variant.id)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <AddOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <StockChip minStock={item.variant.minStock} stockQty={remainingStock} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography color="text.secondary" variant="caption">
                Line total
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.2 }} variant="body2">
                {formatCurrency(item.lineTotal)}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Remaining {formatNumber(remainingStock)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
