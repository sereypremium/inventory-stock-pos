import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useEffect, useState } from 'react';
import { AppTable } from '../../components/common/AppTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { format_date, format_number } from '../../utils/formatters';
import type { Brand, BrandInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const default_brand_form: BrandInput = {
  name: '',
  description: '',
  status: 'active',
};

export function BrandPage() {
  const { brands, products, add_brand, update_brand, delete_brand } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_brand, setEditingBrand] = useState<Brand | null>(null);
  const [delete_target, setDeleteTarget] = useState<Brand | null>(null);

  const filtered_brands = brands
    .filter((brand) =>
      [brand.name, brand.description, brand.status]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const active_brands = brands.filter((brand) => brand.status === 'active').length;

  const handle_save = (values: BrandInput) => {
    const result = editing_brand
      ? update_brand(editing_brand.id, values)
      : add_brand(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingBrand(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_brand(delete_target.id);

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
            onClick={() => {
              setEditingBrand(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Brand
          </Button>
        }
        description="Maintain the master brand list used by products and keep inactive brands out of the main selling flow."
        title="Brands"
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
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Registered brand records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Brands"
          value={format_number(brands.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Available for product assignment"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Brands"
          value={format_number(active_brands)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Products already mapped to a brand"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Linked Products"
          value={format_number(products.length)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search brands"
            value={search_query}
          />
        }
        description="Brand deletion is blocked once products are linked so the catalog stays consistent."
        title="Brand List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Brand</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Products</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_brands.length === 0 && (
            <TableEmptyState colSpan={6} message="No brands match the current search." />
          )}
          {filtered_brands.map((brand) => {
            const product_count = products.filter((product) => product.brand_id === brand.id).length;

            return (
              <TableRow hover key={brand.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {brand.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography color="text.secondary" variant="body2">
                    {brand.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">{format_number(product_count)}</TableCell>
                <TableCell>
                  <StatusChip status={brand.status} />
                </TableCell>
                <TableCell>{format_date(brand.updated_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditingBrand(brand);
                      setDialogOpen(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(brand)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>

      <BrandDialog
        initial_value={editing_brand}
        on_close={() => {
          setDialogOpen(false);
          setEditingBrand(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
      />

      <ConfirmDialog
        confirmLabel="Delete brand"
        description={
          delete_target
            ? `Delete ${delete_target.name}? Linked products will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete brand"
      />
    </Stack>
  );
}

function BrandDialog({
  open,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  initial_value: Brand | null;
  on_close: () => void;
  on_submit: (values: BrandInput) => void;
}) {
  const [form, setForm] = useState<BrandInput>(default_brand_form);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initial_value
        ? {
            name: initial_value.name,
            description: initial_value.description,
            status: initial_value.status,
          }
        : default_brand_form,
    );
  }, [initial_value, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          on_submit(form);
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 0.5 }}>
            <TextField
              label="Brand name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
            <TextField
              label="Description"
              minRows={3}
              multiline
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              value={form.description}
            />
            <TextField
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as BrandInput['status'],
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
            {initial_value ? 'Save Changes' : 'Save Brand'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
