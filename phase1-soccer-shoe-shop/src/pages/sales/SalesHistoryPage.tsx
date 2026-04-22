import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { get_sale_detail } from '../../services/salesService';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';
import { open_print_window } from '../../utils/print';
import { build_receipt_html } from '../../utils/receipt';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function SalesHistoryPage() {
  const inventory = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const customer_map = useMemo(
    () => Object.fromEntries(inventory.customers.map((customer) => [customer.id, customer.name])),
    [inventory.customers],
  );
  const cashier_map = useMemo(
    () => Object.fromEntries(inventory.profiles.map((profile) => [profile.id, profile.full_name])),
    [inventory.profiles],
  );

  const filtered_sales = inventory.sale_headers
    .filter((sale) =>
      [
        sale.sale_no,
        customer_map[sale.customer_id ?? ''] ?? 'Walk-in',
        cashier_map[sale.created_by] ?? '',
        sale.payment_method,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search_query.trim().toLowerCase()),
    )
    .sort((left, right) => right.sale_date.localeCompare(left.sale_date));

  const handle_print = (sale_id: string) => {
    const detail = get_sale_detail(inventory, sale_id);

    if (!detail) {
      setFeedback({
        severity: 'error',
        message: 'Sale detail could not be loaded for printing.',
      });
      return;
    }

    open_print_window({
      title: detail.header.sale_no,
      body_html: build_receipt_html(detail, inventory.settings),
    });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Review completed sales, open the line details, and reprint a receipt when needed."
        title="Sales History"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <DataCard
        actions={
          <SearchToolbar
            on_change={setSearchQuery}
            placeholder="Search by sale no, customer, cashier, or payment method"
            value={search_query}
          />
        }
        description="Sales are stored after the checkout is confirmed and stock has already been deducted."
        title="Sale List"
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          }
        >
          {filtered_sales.length === 0 && (
            <TableEmptyState colSpan={7} message="No sales match the current search." />
          )}
          {filtered_sales.map((sale) => {
            const total_qty = inventory.sale_items
              .filter((item) => item.sale_id === sale.id)
              .reduce((total, item) => total + item.qty, 0);

            return (
              <TableRow hover key={sale.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {sale.sale_no}
                  </Typography>
                </TableCell>
                <TableCell>{format_date_time(sale.sale_date)}</TableCell>
                <TableCell>{customer_map[sale.customer_id ?? ''] ?? 'Walk-in'}</TableCell>
                <TableCell>{cashier_map[sale.created_by] ?? '-'}</TableCell>
                <TableCell align="right">{format_number(total_qty)}</TableCell>
                <TableCell align="right">
                  {format_currency(sale.total_amount, inventory.settings.currency)}
                </TableCell>
                <TableCell align="right">
                  <IconButton component={RouterLink} to={APP_ROUTES.sale_detail(sale.id)}>
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handle_print(sale.id)}>
                    <PrintOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>
    </Stack>
  );
}
