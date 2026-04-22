import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Alert, Box, Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppTable } from '../../components/common/AppTable';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { TableEmptyState } from '../../components/common/TableEmptyState';
import { APP_ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { get_dashboard_snapshot } from '../../services/dashboardService';
import { is_supabase_configured } from '../../services/supabase/client';
import { StockChip } from '../../components/common/StockChip';
import { format_currency, format_date_time, format_number } from '../../utils/formatters';

export function DashboardPage() {
  const { session } = useAuth();
  const inventory = useInventory();
  const snapshot = get_dashboard_snapshot(inventory);

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          session?.role === 'admin' ? (
            <Stack direction="row" spacing={1.25}>
              <Button component={RouterLink} startIcon={<Inventory2OutlinedIcon />} to={APP_ROUTES.products} variant="outlined">
                Products
              </Button>
              <Button component={RouterLink} startIcon={<PointOfSaleOutlinedIcon />} to={APP_ROUTES.pos} variant="contained">
                Open POS
              </Button>
            </Stack>
          ) : (
            <Button component={RouterLink} startIcon={<PointOfSaleOutlinedIcon />} to={APP_ROUTES.pos} variant="contained">
              Open POS
            </Button>
          )
        }
        description="A compact view of today's trading, recent sales, and variants that need attention."
        title={`Welcome back, ${session?.full_name ?? 'team'}`}
      />

      {!is_supabase_configured() && (
        <Alert severity="info">
          Supabase environment values are not connected yet, so the app is currently using mock authentication and local browser storage.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          helper="Completed sales total for today"
          icon={<PaymentsOutlinedIcon fontSize="small" />}
          label="Today Sales"
          value={format_currency(snapshot.today_sales, inventory.settings.currency)}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Estimated gross profit for today"
          icon={<LocalFireDepartmentOutlinedIcon fontSize="small" />}
          label="Today Profit"
          value={format_currency(snapshot.today_profit, inventory.settings.currency)}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Completed transactions today"
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
          label="Today Transactions"
          value={format_number(snapshot.today_transactions)}
        />
        <StatCard
          accent="#ea6a1f"
          helper="Variants at or below minimum stock"
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          label="Low Stock Count"
          value={format_number(snapshot.low_stock_count)}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.05fr 0.95fr' },
        }}
      >
        <DataCard description="The latest completed sales are shown here for quick review." title="Recent Sales">
          <AppTable
            head={
              <TableRow>
                <TableCell>Sale No</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            }
          >
            {snapshot.recent_sales.length === 0 && (
              <TableEmptyState colSpan={4} message="No recent sales are available yet." />
            )}
            {snapshot.recent_sales.map((sale) => (
              <TableRow hover key={sale.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {sale.sale_no}
                  </Typography>
                </TableCell>
                <TableCell>{format_date_time(sale.sold_at)}</TableCell>
                <TableCell>{sale.cashier_name}</TableCell>
                <TableCell align="right">
                  {format_currency(sale.total_amount, inventory.settings.currency)}
                </TableCell>
              </TableRow>
            ))}
          </AppTable>
        </DataCard>

        <DataCard description="Top selling variants help highlight what is moving fastest." title="Top Selling Items">
          <AppTable
            head={
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Qty</TableCell>
              </TableRow>
            }
            min_width={420}
          >
            {snapshot.top_selling_items.length === 0 && (
              <TableEmptyState colSpan={3} message="No top selling items are available yet." />
            )}
            {snapshot.top_selling_items.map((item) => (
              <TableRow hover key={item.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {item.model_name}
                  </Typography>
                </TableCell>
                <TableCell>{item.variant_label}</TableCell>
                <TableCell align="right">{format_number(item.qty)}</TableCell>
              </TableRow>
            ))}
          </AppTable>
        </DataCard>
      </Box>

      {session?.role === 'admin' && (
        <DataCard
          actions={
            <Button component={RouterLink} startIcon={<Inventory2OutlinedIcon />} to={APP_ROUTES.reports_low_stock} variant="outlined">
              Open Low Stock Report
            </Button>
          }
          description="Low stock rows are calculated directly from the current product variant stock values."
          title="Low Stock List"
        >
          <AppTable
            head={
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            }
          >
            {snapshot.low_stock_items.length === 0 && (
              <TableEmptyState colSpan={6} message="All variants are currently above minimum stock." />
            )}
            {snapshot.low_stock_items.map((item) => (
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
                <TableCell align="right">{format_number(item.stock_qty)}</TableCell>
                <TableCell align="right">{format_number(item.min_stock_qty)}</TableCell>
                <TableCell>
                  <StockChip min_stock_qty={item.min_stock_qty} stock_qty={item.stock_qty} />
                </TableCell>
              </TableRow>
            ))}
          </AppTable>
        </DataCard>
      )}
    </Stack>
  );
}
