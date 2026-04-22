import { useMemo, useState } from 'react';
import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_daily_sales_report } from '../../services/reportService';
import { format_currency, format_date_time, format_number, to_date_input_value } from '../../utils/formatters';

export function DailySalesReportPage() {
  const inventory = useInventory();
  const [selected_date, setSelectedDate] = useState(to_date_input_value(new Date()));
  const rows = useMemo(
    () => get_daily_sales_report(inventory, selected_date),
    [inventory, selected_date],
  );
  const total_sales = rows.reduce((total, row) => total + row.total_amount, 0);
  const total_profit = rows.reduce((total, row) => total + row.profit_amount, 0);

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Check daily sales totals, transaction count, and estimated gross profit in a printable table."
        title="Daily Sales Report"
      />

      <ReportFilterBar actions={<PrintButton />}>
        <TextField
          label="Date"
          onChange={(event) => setSelectedDate(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={selected_date}
        />
      </ReportFilterBar>

      <DataCard
        description={`Transactions: ${format_number(rows.length)} - Sales: ${format_currency(total_sales, inventory.settings.currency)} - Profit: ${format_currency(total_profit, inventory.settings.currency)}`}
        title="Daily Sales"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Sale No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Profit</TableCell>
            </TableRow>
          }
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={7} message="No sales found for the selected date." />
          )}
          {rows.map((row) => (
            <TableRow hover key={row.sale_id}>
              <TableCell>{row.sale_no}</TableCell>
              <TableCell>{format_date_time(row.sale_date)}</TableCell>
              <TableCell>{row.customer_name}</TableCell>
              <TableCell>{row.cashier_name}</TableCell>
              <TableCell align="right">{format_number(row.qty)}</TableCell>
              <TableCell align="right">
                {format_currency(row.total_amount, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(row.profit_amount, inventory.settings.currency)}
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>
    </Stack>
  );
}
