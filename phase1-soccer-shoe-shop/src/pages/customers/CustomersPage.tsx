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
import type { Customer, CustomerInput } from '../../types/models';
import { format_date, format_number } from '../../utils/formatters';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const default_customer_form: CustomerInput = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  status: 'active',
};

export function CustomersPage() {
  const { customers, sale_headers, add_customer, update_customer, delete_customer } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_customer, setEditingCustomer] = useState<Customer | null>(null);
  const [delete_target, setDeleteTarget] = useState<Customer | null>(null);

  const filtered_customers = customers
    .filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.address, customer.notes, customer.status]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const active_customers = customers.filter((customer) => customer.status === 'active').length;

  const handle_save = (values: CustomerInput) => {
    const result = editing_customer
      ? update_customer(editing_customer.id, values)
      : add_customer(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingCustomer(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_customer(delete_target.id);

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
              setEditingCustomer(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add Customer
          </Button>
        }
        description="Keep customer records simple so the cashier can quickly attach buyers to sales when needed."
        title="Customers"
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
          helper="Registered customer records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Customers"
          value={format_number(customers.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Available for POS selection"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Active Customers"
          value={format_number(active_customers)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Sales headers linked to customers"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Linked Sales"
          value={format_number(sale_headers.filter((sale) => Boolean(sale.customer_id)).length)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search customers"
            value={search_query}
          />
        }
        description="Customer deletion is blocked once sales history exists so past receipts stay accurate."
        title="Customer List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_customers.length === 0 && (
            <TableEmptyState colSpan={7} message="No customers match the current search." />
          )}
          {filtered_customers.map((customer) => {
            const sale_count = sale_headers.filter((sale) => sale.customer_id === customer.id).length;

            return (
              <TableRow hover key={customer.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {customer.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {customer.notes || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{customer.phone || '-'}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {customer.email || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography color="text.secondary" variant="body2">
                    {customer.address || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">{format_number(sale_count)}</TableCell>
                <TableCell>
                  <StatusChip status={customer.status} />
                </TableCell>
                <TableCell>{format_date(customer.updated_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditingCustomer(customer);
                      setDialogOpen(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(customer)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>

      <CustomerDialog
        initial_value={editing_customer}
        on_close={() => {
          setDialogOpen(false);
          setEditingCustomer(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
      />

      <ConfirmDialog
        confirmLabel="Delete customer"
        description={
          delete_target
            ? `Delete ${delete_target.name}? Sales history will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete customer"
      />
    </Stack>
  );
}

function CustomerDialog({
  open,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  initial_value: Customer | null;
  on_close: () => void;
  on_submit: (values: CustomerInput) => void;
}) {
  const [form, setForm] = useState<CustomerInput>(default_customer_form);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initial_value
        ? {
            name: initial_value.name,
            phone: initial_value.phone,
            email: initial_value.email,
            address: initial_value.address,
            notes: initial_value.notes,
            status: initial_value.status,
          }
        : default_customer_form,
    );
  }, [initial_value, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
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
              label="Customer name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
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
                  status: event.target.value as CustomerInput['status'],
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
            {initial_value ? 'Save Changes' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
