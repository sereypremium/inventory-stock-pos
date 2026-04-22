import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import { Alert, Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatDate, formatNumber } from '../../lib/formatters';

export function StockInDetailPage() {
  const { stockInId } = useParams();
  const { stockIns } = useInventory();

  const record = stockIns.find((entry) => entry.id === stockInId);

  if (!record) {
    return (
      <Stack spacing={3}>
        <PageHeader
          action={
            <Button
              component={RouterLink}
              startIcon={<ArrowBackOutlinedIcon />}
              to="/stock-in"
              variant="outlined"
            >
              Back to Stock In
            </Button>
          }
          description="The requested stock in record could not be found in the current local store."
          title="Stock In Detail"
        />
        <Alert severity="warning">This stock in record is not available.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            component={RouterLink}
            startIcon={<ArrowBackOutlinedIcon />}
            to="/stock-in"
            variant="outlined"
          >
            Back to Stock In
          </Button>
        }
        description="Read-only receipt details for posted stock movement."
        title={record.referenceNo}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Item rows on this receipt"
          icon={<ViewListOutlinedIcon fontSize="small" />}
          label="Total Items"
          value={formatNumber(record.totalItems)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Units added into stock"
          icon={<ScaleOutlinedIcon fontSize="small" />}
          label="Total Quantity"
          value={formatNumber(record.totalQuantity)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Receipt line value"
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
          label="Total Cost"
          value={formatCurrency(record.totalCost)}
        />
      </Box>

      <DataCard
        description="Header information saved when the receipt was posted."
        title="Receipt Summary"
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 3,
          }}
        >
          <SummaryField label="Reference" value={record.referenceNo} />
          <SummaryField label="Supplier" value={record.supplierName} />
          <SummaryField label="Received date" value={formatDate(record.receivedDate)} />
          <SummaryField label="Received by" value={record.receivedBy} />
          <SummaryField label="Posted on" value={formatDate(record.createdAt)} />
          <SummaryField label="Note" value={record.note || 'No note'} />
        </Box>
      </DataCard>

      <DataCard
        description="Snapshot of the exact variants and costs received on this receipt."
        title="Received Lines"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {record.items.length === 0 && (
                <TableEmptyState colSpan={7} message="This receipt has no item rows." />
              )}
              {record.items.map((item) => (
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
                  <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
