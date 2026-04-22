import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { StockChip } from '../../../components/common/StockChip';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { ProductVariant } from '../../../types/models';
import type { PosProductGroup } from '../types';

interface VariantSelectorDialogProps {
  open: boolean;
  product: PosProductGroup | null;
  cartQuantityMap: Record<string, number>;
  onClose: () => void;
  onAddVariant: (variantId: string) => void;
}

function sortSizeValue(left: string, right: string) {
  const leftNumber = Number.parseFloat(left);
  const rightNumber = Number.parseFloat(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right, undefined, { numeric: true });
}

function getInitialVariant(variants: ProductVariant[]) {
  return variants.find((variant) => variant.stockQty > 0) ?? variants[0] ?? null;
}

export function VariantSelectorDialog({
  open,
  product,
  cartQuantityMap,
  onClose,
  onAddVariant,
}: VariantSelectorDialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const colorOptions = useMemo(() => {
    if (!product) {
      return [];
    }

    return Array.from(new Set(product.variants.map((variant) => variant.color)));
  }, [product]);

  const colorVariants = useMemo(() => {
    if (!product) {
      return [];
    }

    return product.variants
      .filter((variant) => variant.color === selectedColor)
      .sort((left, right) => sortSizeValue(left.size, right.size));
  }, [product, selectedColor]);

  const selectedVariant =
    colorVariants.find((variant) => variant.size === selectedSize) ?? colorVariants[0] ?? null;

  const inCartQuantity = selectedVariant ? cartQuantityMap[selectedVariant.id] ?? 0 : 0;
  const remainingToAdd = selectedVariant ? selectedVariant.stockQty - inCartQuantity : 0;

  useEffect(() => {
    if (!open || !product) {
      return;
    }

    const initialVariant = getInitialVariant(product.variants);

    setSelectedColor(initialVariant?.color ?? '');
    setSelectedSize(initialVariant?.size ?? '');
  }, [open, product]);

  useEffect(() => {
    if (colorVariants.length === 0) {
      setSelectedSize('');
      return;
    }

    const hasSelectedSize = colorVariants.some((variant) => variant.size === selectedSize);

    if (!hasSelectedSize) {
      const nextVariant = getInitialVariant(colorVariants) ?? colorVariants[0];
      setSelectedSize(nextVariant?.size ?? '');
    }
  }, [colorVariants, selectedSize]);

  if (!product) {
    return null;
  }

  const content = (
    <Stack spacing={2.25}>
      <Box
        sx={{
          backgroundColor: 'rgba(15, 91, 79, 0.05)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700 }} variant="body1">
          {product.product.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.4 }} variant="body2">
          {product.brandName} | {product.product.styleCode} | {product.categoryName}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          Pick the exact color and size combination before adding to cart.
        </Typography>
      </Box>

      <Divider />

      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 600 }} variant="body2">
          Color
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {colorOptions.map((color) => {
            const colorStock = product.variants
              .filter((variant) => variant.color === color)
              .reduce((total, variant) => total + variant.stockQty, 0);

            return (
              <Chip
                color={selectedColor === color ? 'primary' : 'default'}
                key={color}
                label={`${color} (${formatNumber(colorStock)})`}
                onClick={() => setSelectedColor(color)}
                size={isPhone ? 'medium' : 'small'}
                variant={selectedColor === color ? 'filled' : 'outlined'}
              />
            );
          })}
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 600 }} variant="body2">
          Size
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {colorVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const variantInCartQuantity = cartQuantityMap[variant.id] ?? 0;
            const variantRemaining = variant.stockQty - variantInCartQuantity;
            const isDisabled = variantRemaining <= 0;

            return (
              <Card
                key={variant.id}
                sx={{
                  backgroundColor: isSelected ? 'rgba(15, 91, 79, 0.05)' : 'background.paper',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  opacity: isDisabled ? 0.62 : 1,
                }}
                variant="outlined"
              >
                <CardActionArea
                  disabled={isDisabled}
                  onClick={() => setSelectedSize(variant.size)}
                  sx={{ height: '100%', p: 1.5 }}
                >
                  <Stack spacing={0.75}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        Size {variant.size}
                      </Typography>
                      <StockChip minStock={variant.minStock} stockQty={variantRemaining} />
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {variant.sku}
                    </Typography>
                    {variant.barcode && (
                      <Typography color="text.secondary" variant="caption">
                        Barcode: {variant.barcode}
                      </Typography>
                    )}
                    <Typography color="text.secondary" variant="caption">
                      Available: {formatNumber(Math.max(variantRemaining, 0))}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {formatCurrency(variant.sellingPrice)}
                    </Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Stack>

      <Box
        sx={{
          backgroundColor: 'rgba(15, 91, 79, 0.04)',
          border: '1px solid',
          borderColor: selectedVariant ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 2,
        }}
      >
        {selectedVariant ? (
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="caption">
              Selected variant
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {selectedVariant.size} / {selectedVariant.color}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {selectedVariant.sku}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700 }} variant="body2">
                {formatCurrency(selectedVariant.sellingPrice)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <StockChip minStock={selectedVariant.minStock} stockQty={remainingToAdd} />
              <Chip
                label={`Stock ${formatNumber(Math.max(remainingToAdd, 0))}`}
                size="small"
                variant="outlined"
              />
              {inCartQuantity > 0 && (
                <Chip label={`In cart ${formatNumber(inCartQuantity)}`} size="small" />
              )}
            </Stack>
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">
            No variants are available for the current color selection.
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const addButton = (
    <Button
      disabled={!selectedVariant || remainingToAdd <= 0}
      fullWidth={isPhone}
      onClick={() => {
        if (!selectedVariant || remainingToAdd <= 0) {
          return;
        }

        onAddVariant(selectedVariant.id);
      }}
      size="large"
      startIcon={<AddShoppingCartOutlinedIcon />}
      variant="contained"
    >
      {remainingToAdd <= 0 ? 'Unavailable' : 'Add To Cart'}
    </Button>
  );

  if (isPhone) {
    return (
      <Drawer anchor="bottom" onClose={onClose} open={open}>
        <Box sx={{ maxHeight: '90vh', p: 2, pb: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography variant="h6">Select Variant</Typography>
            <IconButton onClick={onClose}>
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2.25}>
            {content}
            {addButton}
          </Stack>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle sx={{ pr: 6 }}>
        Select Variant
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>{addButton}</DialogActions>
    </Dialog>
  );
}
