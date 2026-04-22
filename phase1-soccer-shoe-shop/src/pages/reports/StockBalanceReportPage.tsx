import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_stock_balance_report } from '../../services/reportService';
import { format_currency, format_number } from '../../utils/formatters';

export function StockBalanceReportPage() {
  const inventory = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const rows = useMemo(() => {
    return get_stock_balance_report(inventory).filter((row) =>
      [row.model_name, row.brand_name, row.category_name, row.sku, row.size, row.color]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    );
  }, [inventory, search_query]);

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Review current variant stock, cost value, and minimum stock thresholds."
        title="Stock Balance Report"
      />

      <ReportFilterBar actions={<PrintButton />}>
        <TextField
          label="Search"
          onChange={(event) => setSearchQuery(event.target.value)}
          size="small"
          value={search_query}
        />
      </ReportFilterBar>

      <DataCard description="Stock value is calculated from current quantity multiplied by current cost price." title="Stock Balance">
        <AppTable
          head={
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Sale</TableCell>
              <TableCell align="right">Stock Value</TableCell>
            </TableRow>
          }
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={7} message="No stock rows match the current filter." />
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
              <TableCell align="right">{format_number(row.stock_qty)}</TableCell>
              <TableCell align="right">{format_number(row.min_stock_qty)}</TableCell>
              <TableCell align="right">
                {format_currency(row.cost_price, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(row.sale_price, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(row.stock_value, inventory.settings.currency)}
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>
    </Stack>
  );
}
