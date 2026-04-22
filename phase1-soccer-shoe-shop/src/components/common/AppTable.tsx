import type { ReactNode } from 'react';
import { Table, TableBody, TableContainer, TableHead } from '@mui/material';

interface AppTableProps {
  head: ReactNode;
  children: ReactNode;
  min_width?: number;
}

export function AppTable({ head, children, min_width = 880 }: AppTableProps) {
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: min_width }}>
        <TableHead>{head}</TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
