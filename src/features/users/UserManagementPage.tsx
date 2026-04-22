import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/formatters';
import type { AppUser, UserInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultUserForm: UserInput = {
  name: '',
  email: '',
  password: '',
  role: 'cashier',
  status: 'active',
};

export function UserManagementPage() {
  const { session, users, addUser, updateUser, deleteUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const filteredUsers = users
    .filter((user) =>
      [user.name, user.email, user.role, user.status]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const activeUsers = users.filter((user) => user.status === 'active').length;
  const adminUsers = users.filter((user) => user.role === 'admin').length;
  const cashierUsers = users.filter((user) => user.role === 'cashier').length;

  const handleSave = (values: UserInput) => {
    const result = editingUser ? updateUser(editingUser.id, values) : addUser(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const result = deleteUser(deleteTarget.id);

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
        description="Manage admin and cashier accounts used for sign-in. The page keeps a small, practical rule set so the shop always retains at least one active admin."
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
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="All local sign-in accounts"
          icon={<ManageAccountsOutlinedIcon fontSize="small" />}
          label="Total Users"
          value={String(users.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Currently available to log in"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Active Users"
          value={String(activeUsers)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="System administrators"
          icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
          label="Admins"
          value={String(adminUsers)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Front counter accounts"
          icon={<PointOfSaleOutlinedIcon fontSize="small" />}
          label="Cashiers"
          value={String(cashierUsers)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search users"
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
        description="Users are stored locally in mock mode for now. Safeguards prevent removing the current session or the last active admin account."
        title="Account Directory"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableEmptyState colSpan={6} message="No users match the current search." />
              )}
              {filteredUsers.map((user) => (
                <TableRow hover key={user.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {user.name}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {user.email}
                      {session?.id === user.id ? ' | Current session' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.role === 'admin' ? 'primary' : 'secondary'}
                      label={user.role === 'admin' ? 'Admin' : 'Cashier'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={user.status} />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditingUser(user);
                        setDialogOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      disabled={session?.id === user.id}
                      onClick={() => setDeleteTarget(user)}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <UserDialog
        initialValue={editingUser}
        onClose={() => {
          setDialogOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />

      <ConfirmDialog
        confirmLabel="Delete user"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? The current session and the last active admin account cannot be removed.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        title="Delete user"
      />
    </Stack>
  );
}

function UserDialog({
  open,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialValue: AppUser | null;
  onClose: () => void;
  onSubmit: (values: UserInput) => void;
}) {
  const [form, setForm] = useState<UserInput>(defaultUserForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            name: initialValue.name,
            email: initialValue.email,
            password: initialValue.password,
            role: initialValue.role,
            status: initialValue.status,
          }
        : defaultUserForm,
    );
  }, [initialValue, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{initialValue ? 'Edit User' : 'Add User'}</DialogTitle>
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
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              mt: 0.5,
            }}
          >
            <TextField
              label="Full name"
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              value={form.name}
            />
            <TextField
              label="Email"
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              required
              type="email"
              value={form.email}
            />
            <TextField
              helperText="Stored locally in mock mode."
              label="Password"
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required
              type="password"
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
        <DialogActions sx={{ pb: 2.5, px: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialValue ? 'Save Changes' : 'Save User'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
