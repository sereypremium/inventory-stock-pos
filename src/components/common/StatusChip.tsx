import { Chip } from '@mui/material';
import type { EntityStatus } from '../../types/models';

export function StatusChip({ status }: { status: EntityStatus }) {
  return (
    <Chip
      color={status === 'active' ? 'success' : 'default'}
      label={status === 'active' ? 'Active' : 'Inactive'}
      size="small"
      variant={status === 'active' ? 'filled' : 'outlined'}
    />
  );
}
