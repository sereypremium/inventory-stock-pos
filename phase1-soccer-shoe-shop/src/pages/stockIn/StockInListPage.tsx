import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';

export function StockInListPage() {
  const { suppliers, purchase_headers, settings } = useInventory();
  const supplier_map = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const total_qty = purchase_headers.reduce((total, purchase) => total + purchase.total_qty, 0);
  const total_amount = purchase_headers.reduce((total, purchase) => total + purchase.total_amount, 0);

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button component={RouterLink} startIcon={<AddOutlinedIcon />} to={APP_ROUTES.stock_in_new} variant="contained">
            New Stock In
          </Button>
        }
        description="Review purchase entries and open any record to inspect the item rows and totals."
        title="Stock In"
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Purchase documents recorded"
          icon={<AddOutlinedIcon fontSize="small" />}
          label="Total Stock In"
          value={format_number(purchase_headers.length)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Units added through stock-in"
          icon={<VisibilityOutlinedIcon fontSize="small" />}
          label="Total Qty"
          value={format_number(total_qty)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Purchase cost recorded"
          icon={<VisibilityOutlinedIcon fontSize="small" />}
          label="Total Amount"
          value={format_currency(total_amount, settings.currency)}
        />
      </Box>

      {purchase_headers.length === 0 ? (
        <EmptyState
          action={
            <Button component={RouterLink} to={APP_ROUTES.stock_in_new} variant="contained">
              Create First Stock In
            </Button>
          }
          description="No purchase records have been saved yet."
          title="No Stock In Records"
        />
      ) : (
        <DataCard description="Stock levels are increased when a stock-in document is saved." title="Purchase List">
          <AppTable
            head={
              <TableRow>
                <TableCell>Purchase No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            }
          >
            {purchase_headers.length === 0 && (
              <TableEmptyState colSpan={6} message="No stock-in records are available." />
            )}
            {[...purchase_headers]
              .sort((left, right) => right.purchase_date.localeCompare(left.purchase_date))
              .map((purchase) => (
                <TableRow hover key={purchase.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      {purchase.purchase_no}
                    </Typography>
                  </TableCell>
                  <TableCell>{format_date_time(purchase.purchase_date)}</TableCell>
                  <TableCell>{supplier_map[purchase.supplier_id] ?? '-'}</TableCell>
                  <TableCell align="right">{format_number(purchase.total_qty)}</TableCell>
                  <TableCell align="right">
                    {format_currency(purchase.total_amount, settings.currency)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={RouterLink} to={APP_ROUTES.stock_in_detail(purchase.id)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </AppTable>
        </DataCard>
      )}
    </Stack>
  );
}
