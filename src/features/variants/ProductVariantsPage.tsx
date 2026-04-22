import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { StockChip } from '../../components/common/StockChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import type { ProductVariant, ProductVariantInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultVariantForm: ProductVariantInput = {
  productId: '',
  sku: '',
  barcode: '',
  size: '',
  color: '',
  sellingPrice: 0,
  costPrice: 0,
  stockQty: 0,
  minStock: 0,
  status: 'active',
};

export function ProductVariantsPage() {
  const {
    products,
    variants,
    addVariant,
    updateVariant,
    deleteVariant,
  } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);

  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

  const filteredVariants = variants
    .filter((variant) => {
      const matchesSearch = [
        variant.sku,
        variant.barcode ?? '',
        variant.size,
        variant.color,
        productMap[variant.productId]?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const matchesProduct = productFilter === 'all' || variant.productId === productFilter;

      return matchesSearch && matchesProduct;
    })
    .sort((left, right) => {
      const leftName = productMap[left.productId]?.name ?? '';
      const rightName = productMap[right.productId]?.name ?? '';

      return leftName.localeCompare(rightName) || left.size.localeCompare(right.size);
    });

  const lowStockVariants = variants.filter((variant) => variant.stockQty <= variant.minStock).length;
  const outOfStockVariants = variants.filter((variant) => variant.stockQty === 0).length;
  const stockUnits = variants.reduce((total, variant) => total + variant.stockQty, 0);
  const sellableValue = variants.reduce(
    (total, variant) => total + variant.stockQty * variant.sellingPrice,
    0,
  );

  const handleSave = (values: ProductVariantInput) => {
    const result = editingVariant
      ? updateVariant(editingVariant.id, values)
      : addVariant(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingVariant(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const result = deleteVariant(deleteTarget.id);
    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });
    setDeleteTarget(null);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            disabled={products.length === 0}
            onClick={() => {
              setEditingVariant(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Variant
          </Button>
        }
        description="This is the stock-control layer for the shop. Each row represents a size and color combination with its own SKU and quantity."
        title="Product Variants"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="Tracked size and color combinations"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Variants"
          value={formatNumber(variants.length)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="At or below minimum stock"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Low Stock"
          value={formatNumber(lowStockVariants)}
        />
        <StatCard
          accent="#b42318"
          helper="Unavailable for immediate sale"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Out of Stock"
          value={formatNumber(outOfStockVariants)}
        />
        <StatCard
          accent="#2d7f4f"
          helper={`${formatNumber(stockUnits)} units currently on hand`}
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Retail Stock Value"
          value={formatCurrency(sellableValue)}
        />
      </Box>

      <DataCard
        actions={
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
            <TextField
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search variants"
            size="small"
            sx={{ minWidth: { xs: '100%', md: 260 } }}
            value={searchQuery}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
            <TextField
              onChange={(event) => setProductFilter(event.target.value)}
              select
              size="small"
              sx={{ minWidth: { xs: '100%', md: 220 } }}
              value={productFilter}
            >
              <MenuItem value="all">All products</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
        description="Stock, price, and minimum quantity are managed here because each variant sells independently."
        title="Variant Stock Grid"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="right">Sell Price</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVariants.length === 0 && (
                <TableEmptyState colSpan={11} message="No variants match the current filters." />
              )}
              {filteredVariants.map((variant) => (
                <TableRow hover key={variant.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {productMap[variant.productId]?.name ?? 'Unknown product'}
                    </Typography>
                  </TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>{variant.barcode || '-'}</TableCell>
                  <TableCell>{variant.size}</TableCell>
                  <TableCell>{variant.color}</TableCell>
                  <TableCell align="right">{formatCurrency(variant.sellingPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(variant.costPrice)}</TableCell>
                  <TableCell align="right">
                    <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
                      <Typography variant="body2">{formatNumber(variant.stockQty)}</Typography>
                      <StockChip minStock={variant.minStock} stockQty={variant.stockQty} />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{formatNumber(variant.minStock)}</TableCell>
                  <TableCell>
                    <StatusChip status={variant.status} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditingVariant(variant);
                        setDialogOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => setDeleteTarget(variant)}>
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <VariantDialog
        initialValue={editingVariant}
        onClose={() => {
          setDialogOpen(false);
          setEditingVariant(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
        products={products.map((product) => ({ id: product.id, name: product.name }))}
      />

      <ConfirmDialog
        confirmLabel="Delete variant"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.sku}? This will remove the size and color stock record.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        title="Delete variant"
      />
    </Stack>
  );
}

function VariantDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
  products,
}: {
  open: boolean;
  initialValue: ProductVariant | null;
  onClose: () => void;
  onSubmit: (values: ProductVariantInput) => void;
  products: Array<{ id: string; name: string }>;
}) {
  const [form, setForm] = useState<ProductVariantInput>(defaultVariantForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            productId: initialValue.productId,
            sku: initialValue.sku,
            barcode: initialValue.barcode ?? '',
            size: initialValue.size,
            color: initialValue.color,
            sellingPrice: initialValue.sellingPrice,
            costPrice: initialValue.costPrice,
            stockQty: initialValue.stockQty,
            minStock: initialValue.minStock,
            status: initialValue.status,
          }
        : {
            ...defaultVariantForm,
            productId: products[0]?.id ?? '',
          },
    );
  }, [initialValue, open, products]);

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
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
              label="Product"
              onChange={(event) =>
                setForm((current) => ({ ...current, productId: event.target.value }))
              }
              required
              select
              value={form.productId}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
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
              value={form.barcode ?? ''}
            />
            <TextField
              label="Size"
              onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}
              required
              value={form.size}
            />
            <TextField
              label="Color"
              onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
              required
              value={form.color}
            />
            <TextField
              label="Selling price"
              onChange={(event) =>
                setForm((current) => ({ ...current, sellingPrice: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.sellingPrice}
            />
            <TextField
              label="Cost price"
              onChange={(event) =>
                setForm((current) => ({ ...current, costPrice: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.costPrice}
            />
            <TextField
              label="Stock quantity"
              onChange={(event) =>
                setForm((current) => ({ ...current, stockQty: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.stockQty}
            />
            <TextField
              label="Minimum stock"
              onChange={(event) =>
                setForm((current) => ({ ...current, minStock: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.minStock}
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
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save Variant'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
