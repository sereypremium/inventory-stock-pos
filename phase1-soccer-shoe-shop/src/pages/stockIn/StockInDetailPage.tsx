import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Box, Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import { get_purchase_detail } from '../../services/stockInService';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';

export function StockInDetailPage() {
  const { id = '' } = useParams();
  const inventory = useInventory();
  const detail = get_purchase_detail(inventory, id);

  if (!detail) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="The requested stock-in document could not be found."
          title="Stock In Detail"
        />
        <EmptyState
          action={
            <Button component={RouterLink} to={APP_ROUTES.stock_in} variant="contained">
              Back to Stock In
            </Button>
          }
          description="The selected purchase may have been removed or the link is no longer valid."
          title="Purchase Not Found"
        />
      </Stack>
    );
  }

  const { header, supplier_name, created_by_name, items } = detail;

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            component={RouterLink}
            startIcon={<ArrowBackOutlinedIcon />}
            to={APP_ROUTES.stock_in}
            variant="outlined"
          >
            Back to Stock In
          </Button>
        }
        description="Review the purchase header and each variant row that increased stock."
        title={header.purchase_no}
      />

      <DataCard description="Purchase header values are saved at the time the stock-in document is posted." title="Purchase Summary">
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 3,
          }}
        >
          <SummaryField label="Supplier" value={supplier_name} />
          <SummaryField label="Purchase Date" value={format_date_time(header.purchase_date)} />
          <SummaryField label="Created By" value={created_by_name} />
          <SummaryField label="Total Qty" value={format_number(header.total_qty)} />
          <SummaryField
            label="Total Amount"
            value={format_currency(header.total_amount, inventory.settings.currency)}
          />
          <SummaryField label="Notes" value={header.notes || '-'} />
        </Box>
      </DataCard>

      <DataCard description="These lines were applied to variant stock when the document was saved." title="Purchase Items">
        <AppTable
          head={
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Line Total</TableCell>
            </TableRow>
          }
        >
          {items.length === 0 && <TableEmptyState colSpan={6} message="No purchase items found." />}
          {items.map((item) => (
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
                {format_currency(item.cost_price, inventory.settings.currency)}
              </TableCell>
              <TableCell align="right">
                {format_currency(item.line_total, inventory.settings.currency)}
              </TableCell>
            </TableRow>
          ))}
        </AppTable>
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
