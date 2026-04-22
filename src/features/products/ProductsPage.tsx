import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import type { Product, ProductInput, TargetGroup } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultProductForm: ProductInput = {
  name: '',
  styleCode: '',
  imageUrl: '',
  brandId: '',
  categoryId: '',
  targetGroup: 'unisex',
  basePrice: 0,
  description: '',
  status: 'active',
};

const targetGroupOptions: Array<{ label: string; value: TargetGroup }> = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
  { label: 'Kids', value: 'kids' },
];

function formatTargetGroup(value: TargetGroup) {
  return targetGroupOptions.find((option) => option.value === value)?.label ?? value;
}

export function ProductsPage() {
  const {
    brands,
    categories,
    products,
    variants,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const brandMap = Object.fromEntries(brands.map((brand) => [brand.id, brand.name]));
  const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category.name]));

  const filteredProducts = products
    .filter((product) =>
      [
        product.name,
        product.styleCode,
        brandMap[product.brandId] ?? '',
        categoryMap[product.categoryId] ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const activeProducts = products.filter((product) => product.status === 'active').length;
  const lowStockProducts = products.filter((product) =>
    variants.some((variant) => variant.productId === product.id && variant.stockQty <= variant.minStock),
  ).length;

  const handleSave = (values: ProductInput) => {
    const result = editingProduct
      ? updateProduct(editingProduct.id, values)
      : addProduct(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const result = deleteProduct(deleteTarget.id);
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
            disabled={brands.length === 0 || categories.length === 0}
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Product
          </Button>
        }
        description="Each product is the parent style for sellable variants. Stock is not controlled here; it stays at the size-color level."
        title="Products"
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
          helper="Parent product styles"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Products"
          value={formatNumber(products.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Currently active in the catalog"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Products"
          value={formatNumber(activeProducts)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Sellable size-color records linked"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Linked Variants"
          value={formatNumber(variants.length)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Products with at least one low variant"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Low Stock Products"
          value={formatNumber(lowStockProducts)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products"
            size="small"
            sx={{ minWidth: { xs: '100%', md: 300 } }}
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
        }
        description="Product deletion is blocked if variants still exist, protecting stock accuracy."
        title="Product Catalog"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Target</TableCell>
                <TableCell align="right">Base Price</TableCell>
                <TableCell align="right">Variants</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 && (
                <TableEmptyState colSpan={9} message="No products match the current search." />
              )}
              {filteredProducts.map((product) => {
                const productVariants = variants.filter((variant) => variant.productId === product.id);
                const totalStock = productVariants.reduce((total, variant) => total + variant.stockQty, 0);

                return (
                  <TableRow hover key={product.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {product.name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {product.styleCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{brandMap[product.brandId] ?? '-'}</TableCell>
                    <TableCell>{categoryMap[product.categoryId] ?? '-'}</TableCell>
                    <TableCell>
                      <Chip label={formatTargetGroup(product.targetGroup)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell align="right">{formatNumber(productVariants.length)}</TableCell>
                    <TableCell align="right">{formatNumber(totalStock)}</TableCell>
                    <TableCell>
                      <StatusChip status={product.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => {
                          setEditingProduct(product);
                          setDialogOpen(true);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => setDeleteTarget(product)}>
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <ProductDialog
        brands={brands}
        categories={categories}
        initialValue={editingProduct}
        onClose={() => {
          setDialogOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />

      <ConfirmDialog
        confirmLabel="Delete product"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? Linked variants will block this action until they are removed first.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        title="Delete product"
      />
    </Stack>
  );
}

function ProductDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
  brands,
  categories,
}: {
  open: boolean;
  initialValue: Product | null;
  onClose: () => void;
  onSubmit: (values: ProductInput) => void;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}) {
  const [form, setForm] = useState<ProductInput>(defaultProductForm);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            name: initialValue.name,
            styleCode: initialValue.styleCode,
            imageUrl: initialValue.imageUrl ?? '',
            brandId: initialValue.brandId,
            categoryId: initialValue.categoryId,
            targetGroup: initialValue.targetGroup,
            basePrice: initialValue.basePrice,
            description: initialValue.description,
            status: initialValue.status,
          }
        : {
            ...defaultProductForm,
            brandId: brands[0]?.id ?? '',
            categoryId: categories[0]?.id ?? '',
          },
    );
    setImageLoadError(false);
  }, [brands, categories, initialValue, open]);

  useEffect(() => {
    setImageLoadError(false);
  }, [form.imageUrl]);

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
              label="Product name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
            <TextField
              label="Style code"
              onChange={(event) =>
                setForm((current) => ({ ...current, styleCode: event.target.value }))
              }
              required
              value={form.styleCode}
            />
            <TextField
              label="Brand"
              onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value }))}
              required
              select
              value={form.brandId}
            >
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Category"
              onChange={(event) =>
                setForm((current) => ({ ...current, categoryId: event.target.value }))
              }
              required
              select
              value={form.categoryId}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Target group"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  targetGroup: event.target.value as TargetGroup,
                }))
              }
              required
              select
              value={form.targetGroup}
            >
              {targetGroupOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Base price"
              onChange={(event) =>
                setForm((current) => ({ ...current, basePrice: Number(event.target.value) }))
              }
              required
              type="number"
              value={form.basePrice}
            />
            <TextField
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ProductInput['status'],
                }))
              }
              required
              select
              value={form.status}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            <TextField
              label="Image URL"
              onChange={(event) =>
                setForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
              placeholder="https://example.com/shoe-image.jpg"
              sx={{ gridColumn: { md: '1 / -1' } }}
              value={form.imageUrl ?? ''}
            />
            {form.imageUrl?.trim() && (
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: imageLoadError ? 'error.main' : 'divider',
                  borderRadius: 2,
                  gridColumn: { md: '1 / -1' },
                  p: 2.5,
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center' }} variant="body2">
                  Image Preview
                </Typography>
                <Box
                  sx={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 91, 79, 0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    height: 168,
                    justifyContent: 'center',
                    marginInline: 'auto',
                    maxWidth: 168,
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  {imageLoadError ? (
                    <Typography color="error.main" sx={{ px: 2, textAlign: 'center' }} variant="body2">
                      Unable to load image preview.
                    </Typography>
                  ) : (
                    <Box
                      alt={form.name || 'Product preview'}
                      component="img"
                      onError={() => setImageLoadError(true)}
                      src={form.imageUrl}
                      sx={{
                        display: 'block',
                        height: '100%',
                        objectFit: 'cover',
                        width: '100%',
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
            <TextField
              label="Description"
              minRows={4}
              multiline
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              sx={{ gridColumn: { md: '1 / -1' } }}
              value={form.description}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save Product'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
