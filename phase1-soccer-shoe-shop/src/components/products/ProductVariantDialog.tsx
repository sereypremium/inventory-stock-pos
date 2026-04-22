import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Box,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { ProductVariant, ProductVariantInput } from '../../types/models';

const default_variant_form: ProductVariantInput = {
  product_id: '',
  sku: '',
  barcode: '',
  size: '',
  color: '',
  cost_price: 0,
  sale_price: 0,
  stock_qty: 0,
  min_stock_qty: 0,
  status: 'active',
};

export function ProductVariantDialog({
  open,
  product_id,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  product_id: string;
  initial_value: ProductVariant | null;
  on_close: () => void;
  on_submit: (values: ProductVariantInput) => void;
}) {
  const [form, setForm] = useState<ProductVariantInput>(default_variant_form);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initial_value) {
      setForm({
        product_id: initial_value.product_id,
        sku: initial_value.sku,
        barcode: initial_value.barcode,
        size: initial_value.size,
        color: initial_value.color,
        cost_price: initial_value.cost_price,
        sale_price: initial_value.sale_price,
        stock_qty: initial_value.stock_qty,
        min_stock_qty: initial_value.min_stock_qty,
        status: initial_value.status,
      });
      return;
    }

    setForm({
      ...default_variant_form,
      product_id,
    });
  }, [initial_value, open, product_id]);

  return (
    <Dialog fullWidth maxWidth="md" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          on_submit(form);
        }}
      >
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              mt: 0.5,
            }}
          >
            <TextField
              label="SKU"
              onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
              required
              value={form.sku}
            />
            <TextField
              label="Barcode"
              onChange={(event) =>
                setForm((current) => ({ ...current, barcode: event.target.value }))
              }
              value={form.barcode}
            />
            <TextField
              label="Size"
              onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}
              required
              value={form.size}
            />
            <TextField
              label="Color"
              onChange={(event) =>
                setForm((current) => ({ ...current, color: event.target.value }))
              }
              required
              value={form.color}
            />
            <TextField
              label="Cost price"
              onChange={(event) =>
                setForm((current) => ({ ...current, cost_price: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.cost_price}
            />
            <TextField
              label="Sale price"
              onChange={(event) =>
                setForm((current) => ({ ...current, sale_price: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.sale_price}
            />
            <TextField
              label="Stock quantity"
              onChange={(event) =>
                setForm((current) => ({ ...current, stock_qty: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.stock_qty}
            />
            <TextField
              label="Minimum stock quantity"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  min_stock_qty: Number(event.target.value),
                }))
              }
              required
              type="number"
              value={form.min_stock_qty}
            />
            <TextField
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ProductVariantInput['status'],
                }))
              }
              required
              select
              value={form.status}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={on_close} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initial_value ? 'Save Changes' : 'Save Variant'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
