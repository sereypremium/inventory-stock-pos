import { TableCell, TableRow, Typography } from '@mui/material';

interface TableEmptyStateProps {
  colSpan: number;
  message: string;
}

export function TableEmptyState({ colSpan, message }: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }} variant="body2">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
