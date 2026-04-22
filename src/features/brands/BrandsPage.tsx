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
import type { Brand, BrandInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultBrandForm: BrandInput = {
  name: '',
  code: '',
  originCountry: '',
  status: 'active',
};

export function BrandsPage() {
  const { brands, products, addBrand, updateBrand, deleteBrand } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const filteredBrands = brands
    .filter((brand) =>
      [brand.name, brand.code, brand.originCountry]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const activeBrands = brands.filter((brand) => brand.status === 'active').length;
  const coveredProducts = products.length;

  const handleSave = (values: BrandInput) => {
    const result = editingBrand ? updateBrand(editingBrand.id, values) : addBrand(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingBrand(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const result = deleteBrand(deleteTarget.id);
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
        description="Keep supplier-facing football brands organized with clean codes and simple status control."
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
          helper="Total brand records in the catalog"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Brands"
          value={formatNumber(brands.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Currently active and sellable"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Brands"
          value={formatNumber(activeBrands)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Products already assigned to a brand"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Covered Products"
          value={formatNumber(coveredProducts)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search brands"
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
        description="Brand deletion is blocked when products are already linked, which keeps the catalog safe."
        title="Brand Directory"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Origin</TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrands.length === 0 && (
                <TableEmptyState colSpan={7} message="No brands match the current search." />
              )}
              {filteredBrands.map((brand) => {
                const productCount = products.filter((product) => product.brandId === brand.id).length;

                return (
                  <TableRow hover key={brand.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {brand.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{brand.code}</TableCell>
                    <TableCell>{brand.originCountry}</TableCell>
                    <TableCell align="right">{formatNumber(productCount)}</TableCell>
                    <TableCell>
                      <StatusChip status={brand.status} />
                    </TableCell>
                    <TableCell>{formatDate(brand.updatedAt)}</TableCell>
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
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <BrandDialog
        initialValue={editingBrand}
        onClose={() => {
          setDialogOpen(false);
          setEditingBrand(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />

      <ConfirmDialog
        confirmLabel="Delete brand"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? Existing linked products will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        title="Delete brand"
      />
    </Stack>
  );
}

function BrandDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialValue: Brand | null;
  onClose: () => void;
  onSubmit: (values: BrandInput) => void;
}) {
  const [form, setForm] = useState<BrandInput>(defaultBrandForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            name: initialValue.name,
            code: initialValue.code,
            originCountry: initialValue.originCountry,
            status: initialValue.status,
          }
        : defaultBrandForm,
    );
  }, [initialValue, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              mt: 0.5,
            }}
          >
            <TextField
              label="Brand name"
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
            <TextField
              label="Origin country"
              onChange={(event) =>
                setForm((current) => ({ ...current, originCountry: event.target.value }))
              }
              required
              value={form.originCountry}
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
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save Brand'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
