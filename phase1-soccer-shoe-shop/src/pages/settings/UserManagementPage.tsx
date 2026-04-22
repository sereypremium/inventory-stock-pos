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
import type { MockAccount, UserInput } from '../../types/models';
import { format_date, format_number } from '../../utils/formatters';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const default_user_form: UserInput = {
  full_name: '',
  email: '',
  password: '',
  role: 'cashier',
  status: 'active',
};

export function UserManagementPage() {
  const { profiles, add_user, update_user, delete_user } = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialog_open, setDialogOpen] = useState(false);
  const [editing_user, setEditingUser] = useState<MockAccount | null>(null);
  const [delete_target, setDeleteTarget] = useState<MockAccount | null>(null);

  const filtered_users = profiles
    .filter((profile) =>
      [profile.full_name, profile.email, profile.role, profile.status]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => left.full_name.localeCompare(right.full_name));

  const admin_count = profiles.filter((profile) => profile.role === 'admin').length;
  const cashier_count = profiles.filter((profile) => profile.role === 'cashier').length;

  const handle_save = (values: UserInput) => {
    const result = editing_user ? update_user(editing_user.id, values) : add_user(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handle_delete = () => {
    if (!delete_target) {
      return;
    }

    const result = delete_user(delete_target.id);

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
              setEditingUser(null);
              setDialogOpen(true);
            }}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Add User
          </Button>
        }
        description="Keep the user list compact and role-based so only admins can access setup modules."
        title="User Management"
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
          helper="Total user records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Users"
          value={format_number(profiles.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Admin role accounts"
          icon={<EditOutlinedIcon fontSize="small" />}
          label="Admins"
          value={format_number(admin_count)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Cashier role accounts"
          icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
          label="Cashiers"
          value={format_number(cashier_count)}
        />
      </Box>

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search users"
            value={search_query}
          />
        }
        description="In mock mode, these users are also the available login accounts shown on the login page."
        title="User List"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_users.length === 0 && (
            <TableEmptyState colSpan={5} message="No users match the current search." />
          )}
          {filtered_users.map((user) => (
            <TableRow hover key={user.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }} variant="body2">
                  {user.full_name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
              <TableCell>
                <StatusChip status={user.status} />
              </TableCell>
              <TableCell>{format_date(user.updated_at)}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => {
                    setEditingUser(user);
                    setDialogOpen(true);
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => setDeleteTarget(user)}>
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>

      <UserDialog
        initial_value={editing_user}
        on_close={() => {
          setDialogOpen(false);
          setEditingUser(null);
        }}
        on_submit={handle_save}
        open={dialog_open}
      />

      <ConfirmDialog
        confirmLabel="Delete user"
        description={
          delete_target
            ? `Delete ${delete_target.full_name}? Transaction history or the last active admin will block this action.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handle_delete}
        open={Boolean(delete_target)}
        title="Delete user"
      />
    </Stack>
  );
}

function UserDialog({
  open,
  initial_value,
  on_close,
  on_submit,
}: {
  open: boolean;
  initial_value: MockAccount | null;
  on_close: () => void;
  on_submit: (values: UserInput) => void;
}) {
  const [form, setForm] = useState<UserInput>(default_user_form);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initial_value
        ? {
            full_name: initial_value.full_name,
            email: initial_value.email,
            password: initial_value.password,
            role: initial_value.role,
            status: initial_value.status,
          }
        : default_user_form,
    );
  }, [initial_value, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={on_close} open={open}>
      <DialogTitle>{initial_value ? 'Edit User' : 'Add User'}</DialogTitle>
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
              label="Full name"
              onChange={(event) =>
                setForm((current) => ({ ...current, full_name: event.target.value }))
              }
              required
              value={form.full_name}
            />
            <TextField
              label="Email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              value={form.email}
            />
            <TextField
              label="Password"
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required
              value={form.password}
            />
            <TextField
              label="Role"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as UserInput['role'],
                }))
              }
              required
              select
              value={form.role}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
            </TextField>
            <TextField
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as UserInput['status'],
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
            {initial_value ? 'Save Changes' : 'Save User'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
