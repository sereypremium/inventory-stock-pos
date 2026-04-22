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
import type { Supplier, SupplierInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultSupplierForm: SupplierInput = {
  name: '',
  code: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
};

export function SuppliersPage() {
  const { suppliers, stockIns, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers
    .filter((supplier) =>
      [
        supplier.name,
        supplier.code,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active').length;
  const suppliersWithTransactions = suppliers.filter((supplier) =>
    stockIns.some((record) => record.supplierId === supplier.id),
  ).length;

  const handleSave = async (values: SupplierInput) => {
    const result = editingSupplier
      ? await updateSupplier(editingSupplier.id, values)
      : await addSupplier(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingSupplier(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const result = await deleteSupplier(deleteTarget.id);
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
              setEditingSupplier(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Supplier
          </Button>
        }
        description="Track purchasing partners for incoming shoe stock and keep their contact details clean and searchable."
        title="Suppliers"
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
          helper="Registered supplier profiles"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Suppliers"
          value={formatNumber(suppliers.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Available for new stock receipts"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Suppliers"
          value={formatNumber(activeSuppliers)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Suppliers already used in stock history"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="With Transactions"
          value={formatNumber(suppliersWithTransactions)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Total posted stock in receipts"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Stock In Records"
          value={formatNumber(stockIns.length)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search suppliers"
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
        description="Supplier deletion is blocked once purchase history exists, which keeps stock in records traceable."
        title="Supplier Directory"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Supplier</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Stock In</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.length === 0 && (
                <TableEmptyState colSpan={9} message="No suppliers match the current search." />
              )}
              {filteredSuppliers.map((supplier) => {
                const transactionCount = stockIns.filter(
                  (record) => record.supplierId === supplier.id,
                ).length;

                return (
                  <TableRow hover key={supplier.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {supplier.name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {supplier.address}
                      </Typography>
                    </TableCell>
                    <TableCell>{supplier.code}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell align="right">{formatNumber(transactionCount)}</TableCell>
                    <TableCell>
                      <StatusChip status={supplier.status} />
                    </TableCell>
                    <TableCell>{formatDate(supplier.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setDialogOpen(true);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => setDeleteTarget(supplier)}>
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

      <SupplierDialog
        initialValue={editingSupplier}
        onClose={() => {
          setDialogOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />

      <ConfirmDialog
        confirmLabel="Delete supplier"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? Existing stock in transactions will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
        open={Boolean(deleteTarget)}
        title="Delete supplier"
      />
    </Stack>
  );
}

function SupplierDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialValue: Supplier | null;
  onClose: () => void;
  onSubmit: (values: SupplierInput) => void | Promise<void>;
}) {
  const [form, setForm] = useState<SupplierInput>(defaultSupplierForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            name: initialValue.name,
            code: initialValue.code,
            contactPerson: initialValue.contactPerson,
            phone: initialValue.phone,
            email: initialValue.email,
            address: initialValue.address,
            status: initialValue.status,
          }
        : defaultSupplierForm,
    );
  }, [initialValue, open]);

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(form);
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
              label="Supplier name"
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
              label="Contact person"
              onChange={(event) =>
                setForm((current) => ({ ...current, contactPerson: event.target.value }))
              }
              required
              value={form.contactPerson}
            />
            <TextField
              label="Phone"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              required
              value={form.phone}
            />
            <TextField
              label="Email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              value={form.email}
            />
            <TextField
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as SupplierInput['status'],
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
              label="Address"
              minRows={3}
              multiline
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              required
              sx={{ gridColumn: { md: '1 / -1' } }}
              value={form.address}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save Supplier'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
