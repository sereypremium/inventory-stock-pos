import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
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
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/formatters';
import type { UserProfile, UserProfileInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const defaultProfileForm: UserProfileInput = {
  fullName: '',
  appRole: 'cashier',
  status: 'active',
};

export function UserManagementPage() {
  const { refreshProfiles, session, updateUserProfile, users } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const filteredUsers = users
    .filter((user) =>
      [user.fullName, user.email, user.appRole, user.status]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  const activeUsers = users.filter((user) => user.status === 'active').length;
  const adminUsers = users.filter((user) => user.appRole === 'admin').length;
  const cashierUsers = users.filter((user) => user.appRole === 'cashier').length;

  const handleRefresh = async () => {
    const result = await refreshProfiles();

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  const handleSave = async (values: UserProfileInput) => {
    if (!editingProfile) {
      return;
    }

    const result = await updateUserProfile(editingProfile.id, values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      setEditingProfile(null);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            onClick={() => {
              void handleRefresh();
            }}
            startIcon={<RefreshOutlinedIcon />}
            variant="contained"
          >
            Refresh Profiles
          </Button>
        }
        description="Manage role and status values from the profiles table. Auth users and passwords stay in Supabase Auth, not in the frontend."
        title="User Management"
      />

      <Alert severity="info">
        Create or invite staff in Supabase Authentication first. The database trigger creates a
        matching profile, then admins can assign Admin or Cashier access here.
      </Alert>

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
          helper="Profiles visible under current RLS policies"
          icon={<ManageAccountsOutlinedIcon fontSize="small" />}
          label="Total Profiles"
          value={String(users.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Profiles allowed to sign in"
          icon={<ManageAccountsOutlinedIcon fontSize="small" />}
          label="Active Profiles"
          value={String(activeUsers)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Full back-office access"
          icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
          label="Admins"
          value={String(adminUsers)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="POS and sales access"
          icon={<PointOfSaleOutlinedIcon fontSize="small" />}
          label="Cashiers"
          value={String(cashierUsers)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search profiles"
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
        description="Profile rows provide the app role and status used by route guards, menus, and RLS policies."
        title="Profile Directory"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Profile</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableEmptyState colSpan={6} message="No profiles match the current search." />
              )}
              {filteredUsers.map((user) => (
                <TableRow hover key={user.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {user.fullName || user.email}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {user.email}
                      {session?.id === user.id ? ' | Current session' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.appRole === 'admin' ? 'primary' : 'secondary'}
                      label={user.appRole === 'admin' ? 'Admin' : 'Cashier'}
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
                        setEditingProfile(user);
                        setDialogOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>

      <ProfileDialog
        currentProfileId={session?.id ?? null}
        initialValue={editingProfile}
        onClose={() => {
          setDialogOpen(false);
          setEditingProfile(null);
        }}
        onSubmit={handleSave}
        open={dialogOpen}
      />
    </Stack>
  );
}

function ProfileDialog({
  open,
  currentProfileId,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  currentProfileId: string | null;
  initialValue: UserProfile | null;
  onClose: () => void;
  onSubmit: (values: UserProfileInput) => Promise<void>;
}) {
  const [form, setForm] = useState<UserProfileInput>(defaultProfileForm);
  const isCurrentProfile = Boolean(initialValue && currentProfileId === initialValue.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      initialValue
        ? {
            fullName: initialValue.fullName,
            appRole: initialValue.appRole,
            status: initialValue.status,
          }
        : defaultProfileForm,
    );
  }, [initialValue, open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Edit Profile</DialogTitle>
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
              label="Full name"
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              required
              value={form.fullName}
            />
            <TextField
              disabled
              helperText="Email is owned by Supabase Auth."
              label="Email"
              type="email"
              value={initialValue?.email ?? ''}
            />
            <TextField
              disabled={isCurrentProfile}
              helperText={
                isCurrentProfile
                  ? 'Use another admin account to change your own role.'
                  : 'Controls admin-only menus and routes.'
              }
              label="Role"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  appRole: event.target.value as UserProfileInput['appRole'],
                }))
              }
              required
              select
              value={form.appRole}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
            </TextField>
            <TextField
              disabled={isCurrentProfile}
              helperText={
                isCurrentProfile
                  ? 'You cannot deactivate your current session.'
                  : 'Inactive profiles cannot sign in to the POS.'
              }
              label="Status"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as UserProfileInput['status'],
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
            Save Profile
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
