import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box } from '@mui/material';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency, formatNumber } from '../../../lib/formatters';
import type { DashboardAnalytics } from '../dashboardUtils';

interface DashboardKpiGridProps {
  analytics: Pick<
    DashboardAnalytics,
    | 'todaySales'
    | 'todayProfit'
    | 'todayTransactions'
    | 'todayAverageSaleValue'
    | 'itemsSoldToday'
    | 'lowStockCount'
    | 'outOfStockCount'
    | 'inventoryStockValue'
    | 'inventoryUnits'
  >;
}

export function DashboardKpiGrid({ analytics }: DashboardKpiGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(6, minmax(0, 1fr))',
        },
      }}
    >
      <StatCard
        accent="#0f5b4f"
        helper={`${formatNumber(analytics.todayTransactions)} transactions today`}
        icon={<PointOfSaleOutlinedIcon fontSize="small" />}
        label="Today Sales"
        value={formatCurrency(analytics.todaySales)}
      />
      <StatCard
        accent="#2d7f4f"
        helper="Net profit after discounts and product cost"
        icon={<PaidOutlinedIcon fontSize="small" />}
        label="Today Profit"
        value={formatCurrency(analytics.todayProfit)}
      />
      <StatCard
        accent="#2f6fcb"
        helper={
          analytics.todayTransactions > 0
            ? `Avg ${formatCurrency(analytics.todayAverageSaleValue)} per sale`
            : 'No transactions recorded today'
        }
        icon={<ReceiptLongOutlinedIcon fontSize="small" />}
        label="Today Transactions"
        value={formatNumber(analytics.todayTransactions)}
      />
      <StatCard
        accent="#ea6a1f"
        helper="Pairs and variant units sold today"
        icon={<ShoppingBagOutlinedIcon fontSize="small" />}
        label="Items Sold Today"
        value={formatNumber(analytics.itemsSoldToday)}
      />
      <StatCard
        accent="#b45a12"
        helper={`${formatNumber(analytics.outOfStockCount)} variants are fully out of stock`}
        icon={<WarningAmberOutlinedIcon fontSize="small" />}
        label="Low Stock Count"
        value={formatNumber(analytics.lowStockCount)}
      />
      <StatCard
        accent="#4053d3"
        helper={`${formatNumber(analytics.inventoryUnits)} units currently on hand`}
        icon={<Inventory2OutlinedIcon fontSize="small" />}
        label="Inventory Stock Value"
        value={formatCurrency(analytics.inventoryStockValue)}
      />
    </Box>
  );
}
