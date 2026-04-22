import { useMemo, useState } from 'react';
import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_monthly_sales_report } from '../../services/reportService';
import { format_currency, format_number, to_month_input_value } from '../../utils/formatters';

export function MonthlySalesReportPage() {
  const inventory = useInventory();
  const [selected_month, setSelectedMonth] = useState(to_month_input_value(new Date()));
  const rows = useMemo(
    () => get_monthly_sales_report(inventory, selected_month),
    [inventory, selected_month],
  );
  const total_sales = rows.reduce((total, row) => total + row.total_amount, 0);
  const total_profit = rows.reduce((total, row) => total + row.profit_amount, 0);
  const total_transactions = rows.reduce((total, row) => total + row.transactions, 0);

  return (
    <Stack spacing={3}>
      <PageHeader
        description="See how the month is trending by day with a simple printable summary."
        title="Monthly Sales Report"
      />

      <ReportFilterBar actions={<PrintButton />}>
        <TextField
          label="Month"
          onChange={(event) => setSelectedMonth(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="month"
          value={selected_month}
        />
      </ReportFilterBar>

      <DataCard
        description={`Transactions: ${format_number(total_transactions)} - Sales: ${format_currency(total_sales, inventory.settings.currency)} - Profit: ${format_currency(total_profit, inventory.settings.currency)}`}
        title="Monthly Summary"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Day</TableCell>
              <TableCell align="right">Transactions</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell align="right">Profit</TableCell>
            </TableRow>
          }
          min_width={560}
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={4} message="No sales found for the selected month." />
          )}
          {rows.map((row) => (
            <TableRow hover key={row.day}>
              <TableCell>{row.day}</TableCell>
              <TableCell align="right">{format_number(row.transactions)}</TableCell>
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
