import { Stack, TableCell, TableRow, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReportFilterBar } from '../../components/common/ReportFilterBar';
import { StockChip } from '../../components/common/StockChip';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { get_low_stock_report } from '../../services/reportService';
import { format_currency, format_number } from '../../utils/formatters';

export function LowStockReportPage() {
  const inventory = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const rows = useMemo(() => {
    return get_low_stock_report(inventory).filter((row) =>
      [row.model_name, row.sku, row.size, row.color]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    );
  }, [inventory, search_query]);

  return (
    <Stack spacing={3}>
      <PageHeader
        description="See which variants are already at or below their minimum stock quantity."
        title="Low Stock Report"
      />

      <ReportFilterBar actions={<PrintButton />}>
        <TextField
          label="Search"
          onChange={(event) => setSearchQuery(event.target.value)}
          size="small"
          value={search_query}
        />
      </ReportFilterBar>

      <DataCard description="Low stock is triggered when stock quantity is less than or equal to the minimum stock quantity." title="Low Stock Items">
        <AppTable
          head={
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Sale Price</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          }
        >
          {rows.length === 0 && (
            <TableEmptyState colSpan={6} message="No low stock rows match the current filter." />
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
                {format_currency(row.sale_price, inventory.settings.currency)}
              </TableCell>
              <TableCell>
                <StockChip min_stock_qty={row.min_stock_qty} stock_qty={row.stock_qty} />
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>
    </Stack>
  );
}
