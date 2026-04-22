import { useMemo, useState } from 'react';
import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_profit_report } from '../../services/reportService';
import { format_currency, format_date_time, to_date_input_value } from '../../utils/formatters';

export function ProfitReportPage() {
  const inventory = useInventory();
  const [from_date, setFromDate] = useState(
    to_date_input_value(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)),
  );
  const [to_date, setToDate] = useState(to_date_input_value(new Date()));
  const rows = useMemo(
    () => get_profit_report(inventory, from_date, to_date),
    [inventory, from_date, to_date],
  );
  const total_profit = rows.reduce((total, row) => total + row.profit_amount, 0);

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Review gross profit by transaction using sale totals and item cost values."
        title="Profit Report"
      />

      <ReportFilterBar actions={<PrintButton />}>
        <TextField
          label="From"
          onChange={(event) => setFromDate(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={from_date}
        />
        <TextField
          label="To"
          onChange={(event) => setToDate(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={to_date}
        />
      </ReportFilterBar>

      <DataCard
        description={`Gross profit total: ${format_currency(total_profit, inventory.settings.currency)}`}
        title="Profit By Sale"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Sale No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Cashier</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Profit</TableCell>
            </TableRow>
          }
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={6} message="No sales found for the selected date range." />
          )}
          {rows.map((row) => (
            <TableRow hover key={row.sale_id}>
              <TableCell>{row.sale_no}</TableCell>
              <TableCell>{format_date_time(row.sale_date)}</TableCell>
              <TableCell>{row.cashier_name}</TableCell>
              <TableCell align="right">
                {format_currency(row.total_amount, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(row.cost_amount, inventory.settings.currency)}
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
