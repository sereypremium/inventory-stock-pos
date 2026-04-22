import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import type { PosVariantSearchItem } from '../../services/salesService';
import { format_currency, format_number } from '../../utils/formatters';

export interface PosProductCardItem {
  product_id: string;
  product_code: string;
  model_name: string;
  brand_name: string;
  category_name: string;
  variants: PosVariantSearchItem[];
}

interface VariantSelectorDialogProps {
  product: PosProductCardItem | null;
  currency?: string;
  open: boolean;
  on_close: () => void;
  on_add_variant: (variant: PosVariantSearchItem) => void;
}

export function VariantSelectorDialog({
  product,
  currency = 'USD',
  open,
  on_close,
  on_add_variant,
}: VariantSelectorDialogProps) {
  const theme = useTheme();
  const is_mobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!product) {
    return null;
  }

  const content = (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ fontWeight: 700 }} variant="body1">
          {product.model_name}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {product.product_code} - {product.brand_name}
        </Typography>
      </Box>

      <Divider />

      <Stack spacing={1.25}>
        {product.variants.map((variant) => {
          const is_out_of_stock = variant.stock_qty <= 0;

          return (
            <Box
              key={variant.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip label={`Size ${variant.size}`} size="small" variant="outlined" />
                    <Chip label={variant.color} size="small" variant="outlined" />
                  </Stack>
                  <Typography sx={{ mt: 1, fontWeight: 600 }} variant="body2">
                    {variant.sku}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    Stock {format_number(variant.stock_qty)} {variant.barcode ? `- ${variant.barcode}` : ''}
                  </Typography>
                </Box>
                <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {format_currency(variant.sale_price, currency)}
                  </Typography>
                  <Button
                    disabled={is_out_of_stock}
                    onClick={() => on_add_variant(variant)}
                    size="small"
                    startIcon={<AddShoppingCartOutlinedIcon />}
                    variant={is_out_of_stock ? 'outlined' : 'contained'}
                  >
                    {is_out_of_stock ? 'Out' : 'Add'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );

  if (is_mobile) {
    return (
      <Drawer anchor="bottom" onClose={on_close} open={open}>
        <Box sx={{ p: 2, pb: 3 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Select Variant</Typography>
            <IconButton onClick={on_close}>
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
          {content}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle sx={{ pr: 6 }}>
        Select Variant
        <IconButton onClick={on_close} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
}
