import { useMemo, useState } from 'react';
import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_best_selling_report } from '../../services/reportService';
import { format_currency, format_number, to_date_input_value } from '../../utils/formatters';

export function BestSellingReportPage() {
  const inventory = useInventory();
  const [from_date, setFromDate] = useState(
    to_date_input_value(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)),
  );
  const [to_date, setToDate] = useState(to_date_input_value(new Date()));
  const rows = useMemo(
    () => get_best_selling_report(inventory, from_date, to_date),
    [inventory, from_date, to_date],
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        description="See which variants moved the most in the selected date range."
        title="Best Selling Report"
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
        description="Quantity is sorted highest first so top movers stay easy to review."
        title="Best Selling Items"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Qty Sold</TableCell>
              <TableCell align="right">Sales Amount</TableCell>
            </TableRow>
          }
          min_width={620}
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={4} message="No sales found for the selected date range." />
          )}
          {rows.map((row) => (
            <TableRow hover key={row.variant_id}>
              <TableCell>
                {row.model_name}
                <br />
                {row.sku}
              </TableCell>
              <TableCell>
                {row.size} / {row.color}
              </TableCell>
              <TableCell align="right">{format_number(row.qty)}</TableCell>
              <TableCell align="right">
                {format_currency(row.sales_amount, inventory.settings.currency)}
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>
    </Stack>
  );
}
