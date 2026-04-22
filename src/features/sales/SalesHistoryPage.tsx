import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Chip,
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
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/formatters';
import { formatPaymentMethod } from '../../services/receiptPrint';
import { getSaleGrandTotal } from '../../services/salesService';

export function SalesHistoryPage() {
  const { sales } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales
    .filter((sale) =>
      [
        sale.receiptNo,
        sale.cashierName,
        sale.customerName,
        sale.paymentMethod,
        sale.note,
        sale.items.map((item) => `${item.productName} ${item.variantSku}`).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .sort((left, right) => new Date(right.soldAt).getTime() - new Date(left.soldAt).getTime());

  const totalRevenue = sales.reduce((total, sale) => total + getSaleGrandTotal(sale), 0);
  const totalUnits = sales.reduce((total, sale) => total + sale.totalQuantity, 0);
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Review completed POS transactions and open any sale to reprint the receipt or inspect the sold lines."
        title="Sales History"
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="Completed sales transactions"
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
          label="Total Sales"
          value={formatNumber(sales.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Revenue captured in mock mode"
          icon={<ShoppingBagOutlinedIcon fontSize="small" />}
          label="Revenue"
          value={formatCurrency(totalRevenue)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Units sold through POS"
          icon={<SearchOutlinedIcon fontSize="small" />}
          label="Units Sold"
          value={formatNumber(totalUnits)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Average sale value"
          icon={<VisibilityOutlinedIcon fontSize="small" />}
          label="Avg Ticket"
          value={formatCurrency(averageTicket)}
        />
      </Box>

      <DataCard
        actions={
          <TextField
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search sales"
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
        description="Sales become read-only history after checkout so receipts and stock deductions stay reliable."
        title="Transaction Log"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Receipt</TableCell>
                <TableCell>Sold At</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.length === 0 && (
                <TableEmptyState colSpan={8} message="No sales match the current search." />
              )}
              {filteredSales.map((sale) => (
                <TableRow hover key={sale.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {sale.receiptNo}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {sale.items[0]?.productName ?? 'No items'}
                      {sale.items.length > 1 ? ` +${sale.items.length - 1} more` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(sale.soldAt)}</TableCell>
                  <TableCell>{sale.cashierName}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatPaymentMethod(sale.paymentMethod)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{formatNumber(sale.totalItems)}</TableCell>
                  <TableCell align="right">{formatNumber(sale.totalQuantity)}</TableCell>
                  <TableCell align="right">{formatCurrency(getSaleGrandTotal(sale))}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                      to={`/sales/${sale.id}`}
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
