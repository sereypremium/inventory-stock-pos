import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { format_number } from '../../utils/formatters';
import type { Gender, Product } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const gender_labels: Record<Gender, string> = {
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex',
  kids: 'Kids',
};

export function ProductListPage() {
  const { brands, categories, products, product_variants, delete_product } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [brand_filter, setBrandFilter] = useState('all');
  const [category_filter, setCategoryFilter] = useState('all');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [delete_target, setDeleteTarget] = useState<Product | null>(null);

  const brand_map = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );
  const category_map = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const filtered_products = products
    .filter((product) => {
      const matches_search = [
        product.product_code,
        product.model_name,
        brand_map[product.brand_id] ?? '',
        category_map[product.category_id] ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase());
      const matches_brand = brand_filter === 'all' || product.brand_id === brand_filter;
      const matches_category =
        category_filter === 'all' || product.category_id === category_filter;

      return matches_search && matches_brand && matches_category;
    })
    .sort((left, right) => left.model_name.localeCompare(right.model_name));

  const active_products = products.filter((product) => product.status === 'active').length;
  const total_variants = product_variants.length;
  const low_stock_products = products.filter((product) =>
    product_variants.some(
      (variant) =>
        variant.product_id === product.id && variant.stock_qty <= variant.min_stock_qty,
    ),
  ).length;

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_product(delete_target.id);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });
    setDeleteTarget(null);
  };

  if (brands.length === 0 || categories.length === 0) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="Products depend on brands and categories, so set up those master records first."
          title="Products"
        />
        <EmptyState
          action={
            <Stack direction="row" spacing={1.25}>
              <Button component={RouterLink} to={APP_ROUTES.brands} variant="outlined">
                Manage Brands
              </Button>
              <Button component={RouterLink} to={APP_ROUTES.categories} variant="contained">
                Manage Categories
              </Button>
            </Stack>
          }
          description="Create at least one active brand and one active category before adding products."
          title="Master Data Required"
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            component={RouterLink}
            startIcon={<AddOutlinedIcon />}
            to={APP_ROUTES.product_new}
            variant="contained"
          >
            New Product
          </Button>
        }
        description="Manage the main shoe models here. Variant-level stock stays inside each product's variant page."
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
          helper="Parent product models"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Products"
          value={format_number(products.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Currently sellable product records"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Products"
          value={format_number(active_products)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="All size and color rows linked to products"
          icon={<ViewInArOutlinedIcon fontSize="small" />}
          label="Total Variants"
          value={format_number(total_variants)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Products with at least one low-stock variant"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Low Stock Products"
          value={format_number(low_stock_products)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            actions={
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                <TextField
                  onChange={(event) => setBrandFilter(event.target.value)}
                  select
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 180 } }}
                  value={brand_filter}
                >
                  <MenuItem value="all">All brands</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  select
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 180 } }}
                  value={category_filter}
                >
                  <MenuItem value="all">All categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            }
            on_change={setSearchQuery}
            placeholder="Search by code, model, brand, or category"
            value={search_query}
          />
        }
        description="Separate create, edit, and variant routes keep the catalog flow simple and maintainable."
        title="Product List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell align="right">Variants</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_products.length === 0 && (
            <TableEmptyState colSpan={8} message="No products match the current filters." />
          )}
          {filtered_products.map((product) => {
            const variants_for_product = product_variants.filter(
              (variant) => variant.product_id === product.id,
            );
            const total_stock = variants_for_product.reduce(
              (total, variant) => total + variant.stock_qty,
              0,
            );

            return (
              <TableRow hover key={product.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {product.model_name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {product.product_code}
                  </Typography>
                </TableCell>
                <TableCell>{brand_map[product.brand_id] ?? '-'}</TableCell>
                <TableCell>{category_map[product.category_id] ?? '-'}</TableCell>
                <TableCell>
                  <Chip label={gender_labels[product.gender]} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">{format_number(variants_for_product.length)}</TableCell>
                <TableCell align="right">{format_number(total_stock)}</TableCell>
                <TableCell>
                  <StatusChip status={product.status} />
                </TableCell>
                <TableCell align="right">
                  <IconButton component={RouterLink} to={APP_ROUTES.product_variants(product.id)}>
                    <ViewInArOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton component={RouterLink} to={APP_ROUTES.product_edit(product.id)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(product)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>

      <ConfirmDialog
        confirmLabel="Delete product"
        description={
          delete_target
            ? `Delete ${delete_target.model_name}? Linked variants will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete product"
      />
    </Stack>
  );
}
