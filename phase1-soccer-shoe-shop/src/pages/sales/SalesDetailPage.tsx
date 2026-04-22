import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Box, Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintButton } from '../../components/common/PrintButton';
import { ReceiptPrint } from '../../components/common/ReceiptPrint';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { get_sale_detail } from '../../services/salesService';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';
import { open_print_window } from '../../utils/print';
import { build_receipt_html } from '../../utils/receipt';

export function SalesDetailPage() {
  const { id = '' } = useParams();
  const inventory = useInventory();
  const detail = get_sale_detail(inventory, id);

  if (!detail) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="The requested sale record could not be found."
          title="Sale Detail"
        />
        <EmptyState
          action={
            <Button component={RouterLink} to={APP_ROUTES.sales} variant="contained">
              Back to Sales
            </Button>
          }
          description="The selected sale may have been removed or the link is no longer valid."
          title="Sale Not Found"
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Stack direction="row" spacing={1.25}>
            <Button
              component={RouterLink}
              startIcon={<ArrowBackOutlinedIcon />}
              to={APP_ROUTES.sales}
              variant="outlined"
            >
              Back to Sales
            </Button>
            <PrintButton
              on_print={() =>
                open_print_window({
                  title: detail.header.sale_no,
                  body_html: build_receipt_html(detail, inventory.settings),
                })
              }
              variant="contained"
            />
          </Stack>
        }
        description="Review the final transaction, line details, and receipt layout for reprinting."
        title={detail.header.sale_no}
      />

      <DataCard description="Sale values are stored after the stock deduction succeeds." title="Sale Summary">
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 3,
          }}
        >
          <SummaryField label="Sale Date" value={format_date_time(detail.header.sale_date)} />
          <SummaryField label="Cashier" value={detail.cashier_name} />
          <SummaryField label="Customer" value={detail.customer_name || 'Walk-in'} />
          <SummaryField
            label="Subtotal"
            value={format_currency(detail.header.subtotal, inventory.settings.currency)}
          />
          <SummaryField
            label="Discount"
            value={format_currency(detail.header.discount_amount, inventory.settings.currency)}
          />
          <SummaryField
            label="Grand Total"
            value={format_currency(detail.header.total_amount, inventory.settings.currency)}
          />
        </Box>
      </DataCard>

      <DataCard description="These item lines were sold and deducted from variant stock." title="Sale Items">
        <AppTable
          head={
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Line Total</TableCell>
            </TableRow>
          }
        >
          {detail.items.length === 0 && <TableEmptyState colSpan={6} message="No sale items found." />}
          {detail.items.map((item) => (
            <TableRow hover key={item.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }} variant="body2">
                  {item.model_name}
                </Typography>
              </TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell>
                {item.size} / {item.color}
              </TableCell>
              <TableCell align="right">{format_number(item.qty)}</TableCell>
              <TableCell align="right">
                {format_currency(item.sale_price, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(item.line_total, inventory.settings.currency)}
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
      </DataCard>

      <DataCard description="This compact receipt preview matches the print output used for reprints." title="Receipt Preview">
        <Box sx={{ p: 3 }}>
          <ReceiptPrint
            address={inventory.settings.address}
            cashier_name={detail.cashier_name}
            change_amount={detail.header.change_amount}
            customer_name={detail.customer_name}
            currency={inventory.settings.currency}
            discount_amount={detail.header.discount_amount}
            items={detail.items}
            paid_amount={detail.header.paid_amount}
            phone={inventory.settings.phone}
            receipt_footer={inventory.settings.receipt_footer}
            sale_date={detail.header.sale_date}
            sale_no={detail.header.sale_no}
            shop_name={inventory.settings.shop_name}
            subtotal={detail.header.subtotal}
            total_amount={detail.header.total_amount}
          />
        </Box>
      </DataCard>
    </Stack>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.75 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}
