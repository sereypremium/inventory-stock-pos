import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { StockChip } from '../../components/common/StockChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { ProductVariantDialog } from '../../components/products/ProductVariantDialog';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { format_currency, format_number } from '../../utils/formatters';
import type { ProductVariant, ProductVariantInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function ProductVariantsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    brands,
    categories,
    products,
    product_variants,
    add_product_variant,
    update_product_variant,
    delete_product_variant,
  } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_variant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [delete_target, setDeleteTarget] = useState<ProductVariant | null>(null);

  const product = products.find((entry) => entry.id === id);
  const brand_map = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );
  const category_map = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  if (!product) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="The requested product could not be found in the current local catalog."
          title="Product Variants"
        />
        <EmptyState
          action={
            <Button component={RouterLink} to={APP_ROUTES.products} variant="contained">
              Back to Products
            </Button>
          }
          description="The selected product may have been removed or the link is no longer valid."
          title="Product Not Found"
        />
      </Stack>
    );
  }

  const variants_for_product = product_variants
    .filter((variant) => variant.product_id === product.id)
    .filter((variant) =>
      [variant.sku, variant.barcode, variant.size, variant.color]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.size.localeCompare(right.size));

  const total_stock = variants_for_product.reduce((total, variant) => total + variant.stock_qty, 0);
  const low_stock_count = variants_for_product.filter(
    (variant) => variant.stock_qty <= variant.min_stock_qty,
  ).length;
  const retail_value = variants_for_product.reduce(
    (total, variant) => total + variant.stock_qty * variant.sale_price,
    0,
  );

  const handle_save = (values: ProductVariantInput) => {
    const result = editing_variant
      ? update_product_variant(editing_variant.id, values)
      : add_product_variant(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingVariant(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_product_variant(delete_target.id);

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
          <Stack direction="row" spacing={1.25}>
            <Button onClick={() => navigate(APP_ROUTES.products)} variant="outlined">
              Back to Products
            </Button>
            <Button
              onClick={() => {
                setEditingVariant(null);
                setDialogOpen(true);
              }}
              startIcon={<AddOutlinedIcon />}
              variant="contained"
            >
              Add Variant
            </Button>
          </Stack>
        }
        description="Manage sellable size and color combinations for the selected product. Stock is controlled only here."
        title={`${product.model_name} Variants`}
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <DataCard
        description="This summary keeps the parent product context visible while you work on variant rows."
        title="Product Summary"
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            p: 3,
          }}
        >
          <SummaryField label="Product Code" value={product.product_code} />
          <SummaryField label="Brand" value={brand_map[product.brand_id] ?? '-'} />
          <SummaryField label="Category" value={category_map[product.category_id] ?? '-'} />
          <SummaryField label="Status" value={product.status === 'active' ? 'Active' : 'Inactive'} />
        </Box>
      </DataCard>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="Size and color combinations"
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          label="Total Variants"
          value={format_number(variants_for_product.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Current units across all variants"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Stock"
          value={format_number(total_stock)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Variants at or below minimum stock"
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          label="Low Stock"
          value={format_number(low_stock_count)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Sale price value of current stock"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Retail Value"
          value={format_currency(retail_value)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search by SKU, barcode, size, or color"
            value={search_query}
          />
        }
        description="Each variant stores its own SKU, barcode, prices, and stock quantities."
        title="Variant List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Sale</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {variants_for_product.length === 0 && (
            <TableEmptyState colSpan={10} message="No variants match the current search." />
          )}
          {variants_for_product.map((variant) => (
            <TableRow hover key={variant.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }} variant="body2">
                  {variant.sku}
                </Typography>
              </TableCell>
              <TableCell>{variant.barcode || '-'}</TableCell>
              <TableCell>{variant.size}</TableCell>
              <TableCell>{variant.color}</TableCell>
              <TableCell align="right">{format_currency(variant.cost_price)}</TableCell>
              <TableCell align="right">{format_currency(variant.sale_price)}</TableCell>
              <TableCell align="right">
                <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="body2">{format_number(variant.stock_qty)}</Typography>
                  <StockChip
                    min_stock_qty={variant.min_stock_qty}
                    stock_qty={variant.stock_qty}
                  />
                </Stack>
              </TableCell>
              <TableCell align="right">{format_number(variant.min_stock_qty)}</TableCell>
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
        </AppTable>
      </DataCard>

      <ProductVariantDialog
        initial_value={editing_variant}
        on_close={() => {
          setDialogOpen(false);
          setEditingVariant(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
        product_id={product.id}
      />

      <ConfirmDialog
        confirmLabel="Delete variant"
        description={
          delete_target
            ? `Delete ${delete_target.sku}? This will remove the variant stock row from the catalog.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete variant"
      />
    </Stack>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.75 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}
