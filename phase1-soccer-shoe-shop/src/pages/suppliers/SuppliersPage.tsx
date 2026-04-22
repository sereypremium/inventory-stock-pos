import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
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
import type { Supplier, SupplierInput } from '../../types/models';
import { format_date, format_number } from '../../utils/formatters';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const default_supplier_form: SupplierInput = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  status: 'active',
};

export function SuppliersPage() {
  const { suppliers, purchase_headers, add_supplier, update_supplier, delete_supplier } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_supplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [delete_target, setDeleteTarget] = useState<Supplier | null>(null);

  const filtered_suppliers = suppliers
    .filter((supplier) =>
      [
        supplier.name,
        supplier.contact_person,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.notes,
        supplier.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const active_suppliers = suppliers.filter((supplier) => supplier.status === 'active').length;

  const handle_save = (values: SupplierInput) => {
    const result = editing_supplier
      ? update_supplier(editing_supplier.id, values)
      : add_supplier(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingSupplier(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_supplier(delete_target.id);

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
        description="Maintain supplier records used by stock-in purchases and replenishment planning."
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
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Registered supplier records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Suppliers"
          value={format_number(suppliers.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Available for stock-in transactions"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Suppliers"
          value={format_number(active_suppliers)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Purchase headers linked to suppliers"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Stock In Records"
          value={format_number(purchase_headers.length)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search suppliers"
            value={search_query}
          />
        }
        description="Supplier deletion is blocked once stock-in history exists so purchasing records remain safe."
        title="Supplier List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Purchases</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_suppliers.length === 0 && (
            <TableEmptyState colSpan={7} message="No suppliers match the current search." />
          )}
          {filtered_suppliers.map((supplier) => {
            const purchase_count = purchase_headers.filter(
              (purchase) => purchase.supplier_id === supplier.id,
            ).length;

            return (
              <TableRow hover key={supplier.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {supplier.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {supplier.notes || supplier.email || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{supplier.contact_person || '-'}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {supplier.phone || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography color="text.secondary" variant="body2">
                    {supplier.address || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">{format_number(purchase_count)}</TableCell>
                <TableCell>
                  <StatusChip status={supplier.status} />
                </TableCell>
                <TableCell>{format_date(supplier.updated_at)}</TableCell>
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
        </AppTable>
      </DataCard>

      <SupplierDialog
        initial_value={editing_supplier}
        on_close={() => {
          setDialogOpen(false);
          setEditingSupplier(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
      />

      <ConfirmDialog
        confirmLabel="Delete supplier"
        description={
          delete_target
            ? `Delete ${delete_target.name}? Stock-in history will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete supplier"
      />
    </Stack>
  );
}

function SupplierDialog({
  open,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  initial_value: Supplier | null;
  on_close: () => void;
  on_submit: (values: SupplierInput) => void;
}) {
  const [form, setForm] = useState<SupplierInput>(default_supplier_form);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initial_value
        ? {
            name: initial_value.name,
            contact_person: initial_value.contact_person,
            phone: initial_value.phone,
            email: initial_value.email,
            address: initial_value.address,
            notes: initial_value.notes,
            status: initial_value.status,
          }
        : default_supplier_form,
    );
  }, [initial_value, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
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
              label="Supplier name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
            <TextField
              label="Contact person"
              onChange={(event) =>
                setForm((current) => ({ ...current, contact_person: event.target.value }))
              }
              value={form.contact_person}
            />
            <TextField
              label="Phone"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              value={form.phone}
            />
            <TextField
              label="Email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              value={form.email}
            />
            <TextField
              label="Address"
              minRows={2}
              multiline
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              value={form.address}
            />
            <TextField
              label="Notes"
              minRows={2}
              multiline
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              value={form.notes}
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={on_close} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initial_value ? 'Save Changes' : 'Save Supplier'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
