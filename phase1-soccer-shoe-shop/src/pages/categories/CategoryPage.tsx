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
import type { Category, CategoryInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const default_category_form: CategoryInput = {
  name: '',
  description: '',
  status: 'active',
};

export function CategoryPage() {
  const { categories, products, add_category, update_category, delete_category } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_category, setEditingCategory] = useState<Category | null>(null);
  const [delete_target, setDeleteTarget] = useState<Category | null>(null);

  const filtered_categories = categories
    .filter((category) =>
      [category.name, category.description, category.status]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const active_categories = categories.filter((category) => category.status === 'active').length;

  const handle_save = (values: CategoryInput) => {
    const result = editing_category
      ? update_category(editing_category.id, values)
      : add_category(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingCategory(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_category(delete_target.id);

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
              setEditingCategory(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Category
          </Button>
        }
        description="Keep product groupings practical so the catalog stays readable for the shop team."
        title="Categories"
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
          helper="Registered category records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Categories"
          value={format_number(categories.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Available for product assignment"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Categories"
          value={format_number(active_categories)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Products already grouped by category"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Linked Products"
          value={format_number(products.length)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search categories"
            value={search_query}
          />
        }
        description="Category deletion is blocked once products are assigned so catalog references stay stable."
        title="Category List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Products</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_categories.length === 0 && (
            <TableEmptyState colSpan={6} message="No categories match the current search." />
          )}
          {filtered_categories.map((category) => {
            const product_count = products.filter(
              (product) => product.category_id === category.id,
            ).length;

            return (
              <TableRow hover key={category.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {category.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography color="text.secondary" variant="body2">
                    {category.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">{format_number(product_count)}</TableCell>
                <TableCell>
                  <StatusChip status={category.status} />
                </TableCell>
                <TableCell>{format_date(category.updated_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditingCategory(category);
                      setDialogOpen(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(category)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>

      <CategoryDialog
        initial_value={editing_category}
        on_close={() => {
          setDialogOpen(false);
          setEditingCategory(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
      />

      <ConfirmDialog
        confirmLabel="Delete category"
        description={
          delete_target
            ? `Delete ${delete_target.name}? Linked products will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete category"
      />
    </Stack>
  );
}

function CategoryDialog({
  open,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  initial_value: Category | null;
  on_close: () => void;
  on_submit: (values: CategoryInput) => void;
}) {
  const [form, setForm] = useState<CategoryInput>(default_category_form);

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
        : default_category_form,
    );
  }, [initial_value, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit Category' : 'Add Category'}</DialogTitle>
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
              label="Category name"
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
                  status: event.target.value as CategoryInput['status'],
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
            {initial_value ? 'Save Changes' : 'Save Category'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
