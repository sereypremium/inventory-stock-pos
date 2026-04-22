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
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatDate, formatNumber } from '../../lib/formatters';
import type { Category, CategoryInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultCategoryForm: CategoryInput = {
  name: '',
  code: '',
  description: '',
  status: 'active',
};

export function CategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const filteredCategories = categories
    .filter((category) =>
      [category.name, category.code, category.description]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const activeCategories = categories.filter((category) => category.status === 'active').length;
  const mappedProducts = products.length;

  const handleSave = async (values: CategoryInput) => {
    const result = editingCategory
      ? await updateCategory(editingCategory.id, values)
      : await addCategory(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingCategory(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const result = await deleteCategory(deleteTarget.id);
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
        description="Group your football boots into clear selling types such as firm ground, turf, indoor, or junior."
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
          helper="All catalog category groups"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Categories"
          value={formatNumber(categories.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Currently available for assignment"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Categories"
          value={formatNumber(activeCategories)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Products already categorized"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Mapped Products"
          value={formatNumber(mappedProducts)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search categories"
            size="small"
            sx={{ minWidth: { xs: '100%', md: 280 } }}
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
        description="Categories can only be removed when they are no longer assigned to products."
        title="Category Setup"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.length === 0 && (
                <TableEmptyState colSpan={7} message="No categories match the current search." />
              )}
              {filteredCategories.map((category) => {
                const productCount = products.filter(
                  (product) => product.categoryId === category.id,
                ).length;

                return (
                  <TableRow hover key={category.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {category.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{category.code}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography color="text.secondary" variant="body2">
                        {category.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatNumber(productCount)}</TableCell>
                    <TableCell>
                      <StatusChip status={category.status} />
                    </TableCell>
                    <TableCell>{formatDate(category.updatedAt)}</TableCell>
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
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <CategoryDialog
        initialValue={editingCategory}
        onClose={() => {
          setDialogOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />

      <ConfirmDialog
        confirmLabel="Delete category"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? Existing linked products will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
        open={Boolean(deleteTarget)}
        title="Delete category"
      />
    </Stack>
  );
}

function CategoryDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialValue: Category | null;
  onClose: () => void;
  onSubmit: (values: CategoryInput) => void | Promise<void>;
}) {
  const [form, setForm] = useState<CategoryInput>(defaultCategoryForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            name: initialValue.name,
            code: initialValue.code,
            description: initialValue.description,
            status: initialValue.status,
          }
        : defaultCategoryForm,
    );
  }, [initialValue, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(form);
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 0.5 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                label="Category name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={form.name}
              />
              <TextField
                label="Code"
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                required
                value={form.code}
              />
            </Box>
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
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save Category'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
