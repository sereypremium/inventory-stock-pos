import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  InputAdornment,
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
import { Link as RouterLink } from 'react-router-dom';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatDate, formatNumber } from '../../lib/formatters';
import { useState } from 'react';

export function StockInListPage() {
  const { stockIns } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = stockIns
    .filter((record) =>
      [record.referenceNo, record.supplierName, record.receivedBy, record.note]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort(
      (left, right) =>
        new Date(right.receivedDate).getTime() - new Date(left.receivedDate).getTime(),
    );

  const totalQuantity = stockIns.reduce((total, record) => total + record.totalQuantity, 0);
  const totalCost = stockIns.reduce((total, record) => total + record.totalCost, 0);
  const usedSuppliers = new Set(stockIns.map((record) => record.supplierId)).size;

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            component={RouterLink}
            startIcon={<AddOutlinedIcon />}
            to="/stock-in/new"
            variant="contained"
          >
            New Stock In
          </Button>
        }
        description="Review posted receiving transactions and drill into each receipt without editing historical stock movements."
        title="Stock In"
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="Posted receipt records"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Receipts"
          value={formatNumber(stockIns.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Units added into stock"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Received Quantity"
          value={formatNumber(totalQuantity)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Value captured from stock in lines"
          icon={<VisibilityOutlinedIcon fontSize="small" />}
          label="Received Cost"
          value={formatCurrency(totalCost)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Suppliers already used"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Used Suppliers"
          value={formatNumber(usedSuppliers)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search stock in"
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
        description="Receipts are append-only here so the variant stock trail stays reliable."
        title="Receipt History"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Received By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 && (
                <TableEmptyState colSpan={8} message="No stock in records match the current search." />
              )}
              {filteredRecords.map((record) => (
                <TableRow hover key={record.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {record.referenceNo}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {record.note || 'No note'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(record.receivedDate)}</TableCell>
                  <TableCell>{record.supplierName}</TableCell>
                  <TableCell align="right">{formatNumber(record.totalItems)}</TableCell>
                  <TableCell align="right">{formatNumber(record.totalQuantity)}</TableCell>
                  <TableCell align="right">{formatCurrency(record.totalCost)}</TableCell>
                  <TableCell>{record.receivedBy}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                      to={`/stock-in/${record.id}`}
                      variant="outlined"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DataCard>
    </Stack>
  );
}
