import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/formatters';
import { formatPaymentMethod, printSaleReceipt } from '../../services/receiptPrint';
import { getSaleDiscountAmount, getSaleGrandTotal } from '../../services/salesService';
import { SaleReceiptCard } from './SaleReceiptCard';

export function SaleDetailPage() {
  const { saleId } = useParams();
  const { settings } = useAuth();
  const { sales } = useInventory();

  const sale = sales.find((entry) => entry.id === saleId);

  if (!sale) {
    return (
      <Stack spacing={3}>
        <PageHeader
          action={
            <Button
              component={RouterLink}
              startIcon={<ArrowBackOutlinedIcon />}
              to="/sales"
              variant="outlined"
            >
              Back to Sales
            </Button>
          }
          description="The requested sale could not be found in the active workspace data."
          title="Sale Detail"
        />
        <Alert severity="warning">This sale record is not available.</Alert>
      </Stack>
    );
  }

  const discountAmount = getSaleDiscountAmount(sale);
  const grandTotal = getSaleGrandTotal(sale);

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Stack direction="row" spacing={1.25}>
            <Button
              component={RouterLink}
              startIcon={<ArrowBackOutlinedIcon />}
              to="/sales"
              variant="outlined"
            >
              Back to Sales
            </Button>
            <Button
              onClick={() => printSaleReceipt(sale, settings)}
              startIcon={<PrintOutlinedIcon />}
              variant="contained"
            >
              Print Receipt
            </Button>
          </Stack>
        }
        description="Completed POS sale with read-only lines, payment details, and a printable receipt view."
        title={sale.receiptNo}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Distinct lines in the cart"
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
          label="Items"
          value={formatNumber(sale.totalItems)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Units sold on this receipt"
          icon={<ScaleOutlinedIcon fontSize="small" />}
          label="Quantity"
          value={formatNumber(sale.totalQuantity)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Grand total after discount"
          icon={<ShoppingBagOutlinedIcon fontSize="small" />}
          label="Grand Total"
          value={formatCurrency(grandTotal)}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.25fr 0.75fr' },
        }}
      >
        <Stack spacing={2}>
          <DataCard
            description="Header details captured when the cashier confirmed checkout."
            title="Sale Summary"
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                p: 3,
              }}
            >
              <SummaryField label="Receipt" value={sale.receiptNo} />
              <SummaryField label="Sold At" value={formatDateTime(sale.soldAt)} />
              <SummaryField label="Cashier" value={sale.cashierName} />
              <SummaryField label="Customer" value={sale.customerName || 'Walk-in'} />
              <SummaryField
                label="Payment"
                value={formatPaymentMethod(sale.paymentMethod)}
              />
              <SummaryField label="Subtotal" value={formatCurrency(sale.subtotal)} />
              <SummaryField label="Discount" value={formatCurrency(discountAmount)} />
              <SummaryField label="Total" value={formatCurrency(grandTotal)} />
              <SummaryField label="Paid" value={formatCurrency(sale.paidAmount)} />
              <SummaryField label="Change" value={formatCurrency(sale.changeAmount)} />
              <SummaryField
                label="Note"
                value={sale.note || 'No note'}
              />
            </Box>
          </DataCard>

          <DataCard
            description="Exact lines sold and stored on the receipt."
            title="Sold Items"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Line Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.length === 0 && (
                    <TableEmptyState colSpan={7} message="This sale has no item rows." />
                  )}
                  {sale.items.map((item) => (
                    <TableRow hover key={item.id}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }} variant="body2">
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.variantSku}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell align="right">{formatNumber(item.quantity)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DataCard>
        </Stack>

        <DataCard
          actions={
            <Chip
              label={formatPaymentMethod(sale.paymentMethod)}
              size="small"
              variant="outlined"
            />
          }
          description="Printable compact receipt preview."
          title="Receipt Preview"
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <SaleReceiptCard sale={sale} />
          </Box>
        </DataCard>
      </Box>
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
