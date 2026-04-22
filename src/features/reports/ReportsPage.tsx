import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from '../../lib/formatters';
import type { PrintableReportData } from '../../services/reportPrint';
import { printReport } from '../../services/reportPrint';
import { formatPaymentMethod } from '../../services/receiptPrint';
import { getSaleGrandTotal } from '../../services/salesService';
import { ReportPreviewCard } from './ReportPreviewCard';

type ReportKey =
  | 'daily-sales'
  | 'monthly-sales'
  | 'stock-balance'
  | 'low-stock'
  | 'best-selling'
  | 'profit';

const reportOptions: Array<{ label: string; value: ReportKey }> = [
  { label: 'Daily Sales Report', value: 'daily-sales' },
  { label: 'Monthly Sales Report', value: 'monthly-sales' },
  { label: 'Stock Balance Report', value: 'stock-balance' },
  { label: 'Low Stock Report', value: 'low-stock' },
  { label: 'Best Selling Report', value: 'best-selling' },
  { label: 'Profit Report', value: 'profit' },
];

function getTodayValue() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}-01`));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ReportsPage() {
  const { settings } = useAuth();
  const { brands, categories, products, variants, sales } = useInventory();
  const [reportKey, setReportKey] = useState<ReportKey>('daily-sales');
  const [dailyDate, setDailyDate] = useState(getTodayValue());
  const [monthFilter, setMonthFilter] = useState(getCurrentMonthValue());
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'active',
  );
  const [lowStockSearch, setLowStockSearch] = useState('');
  const [lowStockMode, setLowStockMode] = useState<
    'all-alerts' | 'low-only' | 'out-of-stock'
  >('all-alerts');
  const [bestSellingMonth, setBestSellingMonth] = useState(getCurrentMonthValue());
  const [bestSellingLimit, setBestSellingLimit] = useState('10');
  const [profitMonth, setProfitMonth] = useState(getCurrentMonthValue());

  const brandMap = Object.fromEntries(brands.map((brand) => [brand.id, brand.name]));
  const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

  const buildDailySalesReport = (): PrintableReportData => {
    const reportSales = sales
      .filter((sale) => sale.soldAt.slice(0, 10) === dailyDate)
      .sort((left, right) => new Date(left.soldAt).getTime() - new Date(right.soldAt).getTime());
    const totalRevenue = reportSales.reduce((total, sale) => total + getSaleGrandTotal(sale), 0);
    const totalQuantity = reportSales.reduce((total, sale) => total + sale.totalQuantity, 0);
    const averageTicket = reportSales.length > 0 ? totalRevenue / reportSales.length : 0;

    return {
      title: 'Daily Sales Report',
      subtitle: 'Completed POS transactions for one business day.',
      filters: [
        { label: 'Report Date', value: formatDate(dailyDate) },
        { label: 'Scope', value: 'All completed sales' },
      ],
      metrics: [
        { label: 'Transactions', value: formatNumber(reportSales.length) },
        { label: 'Units Sold', value: formatNumber(totalQuantity) },
        { label: 'Revenue', value: formatCurrency(totalRevenue) },
        { label: 'Avg Ticket', value: formatCurrency(averageTicket) },
      ],
      columns: [
        { label: 'Time' },
        { label: 'Receipt' },
        { label: 'Cashier' },
        { label: 'Payment' },
        { label: 'Qty', align: 'right' },
        { label: 'Total', align: 'right' },
      ],
      rows: reportSales.map((sale) => [
        formatTime(sale.soldAt),
        sale.receiptNo,
        sale.cashierName,
        formatPaymentMethod(sale.paymentMethod),
        formatNumber(sale.totalQuantity),
        formatCurrency(getSaleGrandTotal(sale)),
      ]),
      emptyMessage: 'No completed sales were posted on the selected date.',
    };
  };

  const buildMonthlySalesReport = (): PrintableReportData => {
    const reportSales = sales
      .filter((sale) => sale.soldAt.startsWith(monthFilter))
      .sort((left, right) => new Date(right.soldAt).getTime() - new Date(left.soldAt).getTime());
    const totalRevenue = reportSales.reduce((total, sale) => total + getSaleGrandTotal(sale), 0);
    const totalQuantity = reportSales.reduce((total, sale) => total + sale.totalQuantity, 0);
    const averageTicket = reportSales.length > 0 ? totalRevenue / reportSales.length : 0;

    return {
      title: 'Monthly Sales Report',
      subtitle: 'Completed sales grouped inside the selected month.',
      filters: [
        { label: 'Month', value: formatMonthLabel(monthFilter) },
        { label: 'Scope', value: 'All completed sales' },
      ],
      metrics: [
        { label: 'Transactions', value: formatNumber(reportSales.length) },
        { label: 'Units Sold', value: formatNumber(totalQuantity) },
        { label: 'Revenue', value: formatCurrency(totalRevenue) },
        { label: 'Avg Ticket', value: formatCurrency(averageTicket) },
      ],
      columns: [
        { label: 'Date' },
        { label: 'Receipt' },
        { label: 'Cashier' },
        { label: 'Payment' },
        { label: 'Qty', align: 'right' },
        { label: 'Total', align: 'right' },
      ],
      rows: reportSales.map((sale) => [
        formatDateTime(sale.soldAt),
        sale.receiptNo,
        sale.cashierName,
        formatPaymentMethod(sale.paymentMethod),
        formatNumber(sale.totalQuantity),
        formatCurrency(getSaleGrandTotal(sale)),
      ]),
      emptyMessage: 'No completed sales were posted in the selected month.',
    };
  };

  const buildStockBalanceReport = (): PrintableReportData => {
    const filteredVariants = variants
      .filter((variant) => {
        const product = productMap[variant.productId];

        if (!product) {
          return false;
        }

        if (stockStatusFilter === 'active' && (product.status !== 'active' || variant.status !== 'active')) {
          return false;
        }

        if (stockStatusFilter === 'inactive' && product.status === 'active' && variant.status === 'active') {
          return false;
        }

        return [
          product.name,
          product.styleCode,
          brandMap[product.brandId] ?? '',
          categoryMap[product.categoryId] ?? '',
          variant.sku,
          variant.size,
          variant.color,
        ]
          .join(' ')
          .toLowerCase()
          .includes(stockSearch.trim().toLowerCase());
      })
      .sort((left, right) => {
        const leftName = productMap[left.productId]?.name ?? '';
        const rightName = productMap[right.productId]?.name ?? '';
        return leftName.localeCompare(rightName) || left.size.localeCompare(right.size);
      });

    const totalUnits = filteredVariants.reduce((total, variant) => total + variant.stockQty, 0);
    const totalCostValue = filteredVariants.reduce(
      (total, variant) => total + variant.stockQty * variant.costPrice,
      0,
    );
    const totalRetailValue = filteredVariants.reduce(
      (total, variant) => total + variant.stockQty * variant.sellingPrice,
      0,
    );

    return {
      title: 'Stock Balance Report',
      subtitle: 'Current stock on hand by product variant.',
      filters: [
        { label: 'Search', value: stockSearch.trim() || 'All variants' },
        { label: 'Status', value: stockStatusFilter === 'all' ? 'All' : stockStatusFilter === 'active' ? 'Active Only' : 'Inactive Only' },
      ],
      metrics: [
        { label: 'Variants', value: formatNumber(filteredVariants.length) },
        { label: 'Stock Units', value: formatNumber(totalUnits) },
        { label: 'Cost Value', value: formatCurrency(totalCostValue) },
        { label: 'Retail Value', value: formatCurrency(totalRetailValue) },
      ],
      columns: [
        { label: 'Product' },
        { label: 'Brand' },
        { label: 'Variant' },
        { label: 'Stock', align: 'right' },
        { label: 'Min', align: 'right' },
        { label: 'Cost Value', align: 'right' },
        { label: 'Retail Value', align: 'right' },
      ],
      rows: filteredVariants.map((variant) => {
        const product = productMap[variant.productId]!;

        return [
          `${product.name} (${product.styleCode})`,
          brandMap[product.brandId] ?? '-',
          `${variant.sku} | ${variant.size} / ${variant.color}`,
          formatNumber(variant.stockQty),
          formatNumber(variant.minStock),
          formatCurrency(variant.stockQty * variant.costPrice),
          formatCurrency(variant.stockQty * variant.sellingPrice),
        ];
      }),
      emptyMessage: 'No stock balance rows match the current filters.',
    };
  };

  const buildLowStockReport = (): PrintableReportData => {
    const filteredVariants = variants
      .filter((variant) => {
        const product = productMap[variant.productId];

        if (!product || product.status !== 'active' || variant.status !== 'active') {
          return false;
        }

        const matchesAlert =
          lowStockMode === 'all-alerts'
            ? variant.stockQty <= variant.minStock
            : lowStockMode === 'out-of-stock'
              ? variant.stockQty === 0
              : variant.stockQty > 0 && variant.stockQty <= variant.minStock;

        if (!matchesAlert) {
          return false;
        }

        return [product.name, variant.sku, variant.size, variant.color]
          .join(' ')
          .toLowerCase()
          .includes(lowStockSearch.trim().toLowerCase());
      })
      .sort((left, right) => left.stockQty - right.stockQty);

    const outOfStockCount = filteredVariants.filter((variant) => variant.stockQty === 0).length;
    const lowOnlyCount = filteredVariants.filter(
      (variant) => variant.stockQty > 0 && variant.stockQty <= variant.minStock,
    ).length;
    const affectedProducts = new Set(filteredVariants.map((variant) => variant.productId)).size;

    return {
      title: 'Low Stock Report',
      subtitle: 'Variants currently at or below their minimum stock threshold.',
      filters: [
        { label: 'Search', value: lowStockSearch.trim() || 'All alert items' },
        {
          label: 'Alert Mode',
          value:
            lowStockMode === 'all-alerts'
              ? 'All Alerts'
              : lowStockMode === 'out-of-stock'
                ? 'Out of Stock Only'
                : 'Low Stock Only',
        },
      ],
      metrics: [
        { label: 'Alert Variants', value: formatNumber(filteredVariants.length) },
        { label: 'Out of Stock', value: formatNumber(outOfStockCount) },
        { label: 'Low Stock', value: formatNumber(lowOnlyCount) },
        { label: 'Affected Products', value: formatNumber(affectedProducts) },
      ],
      columns: [
        { label: 'Product' },
        { label: 'SKU' },
        { label: 'Variant' },
        { label: 'Stock', align: 'right' },
        { label: 'Min', align: 'right' },
        { label: 'Alert' },
      ],
      rows: filteredVariants.map((variant) => [
        productMap[variant.productId]?.name ?? 'Unknown product',
        variant.sku,
        `${variant.size} / ${variant.color}`,
        formatNumber(variant.stockQty),
        formatNumber(variant.minStock),
        variant.stockQty === 0 ? 'Out of Stock' : 'Low Stock',
      ]),
      emptyMessage: 'No low stock rows match the current filters.',
    };
  };

  const buildBestSellingReport = (): PrintableReportData => {
    const monthlySales = sales.filter((sale) => sale.soldAt.startsWith(bestSellingMonth));
    const aggregate = new Map<
      string,
      {
        productName: string;
        variantLabel: string;
        quantity: number;
        revenue: number;
      }
    >();

    monthlySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.variantId;
        const current = aggregate.get(key);

        if (!current) {
          aggregate.set(key, {
            productName: item.productName,
            variantLabel: `${item.variantSku} | ${item.size} / ${item.color}`,
            quantity: item.quantity,
            revenue: item.lineTotal,
          });
          return;
        }

        current.quantity += item.quantity;
        current.revenue += item.lineTotal;
      });
    });

    const rankedRows = [...aggregate.values()]
      .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
      .slice(0, Number(bestSellingLimit));
    const totalUnits = rankedRows.reduce((total, row) => total + row.quantity, 0);
    const totalRevenue = rankedRows.reduce((total, row) => total + row.revenue, 0);

    return {
      title: 'Best Selling Report',
      subtitle: 'Top selling variants for the selected month.',
      filters: [
        { label: 'Month', value: formatMonthLabel(bestSellingMonth) },
        { label: 'Top Rows', value: bestSellingLimit },
      ],
      metrics: [
        { label: 'Ranked Variants', value: formatNumber(rankedRows.length) },
        { label: 'Units Sold', value: formatNumber(totalUnits) },
        { label: 'Revenue', value: formatCurrency(totalRevenue) },
        { label: 'Transactions', value: formatNumber(monthlySales.length) },
      ],
      columns: [
        { label: 'Rank', align: 'right' },
        { label: 'Product' },
        { label: 'Variant' },
        { label: 'Units Sold', align: 'right' },
        { label: 'Revenue', align: 'right' },
      ],
      rows: rankedRows.map((row, index) => [
        formatNumber(index + 1),
        row.productName,
        row.variantLabel,
        formatNumber(row.quantity),
        formatCurrency(row.revenue),
      ]),
      emptyMessage: 'No sales are available for the selected month.',
    };
  };

  const buildProfitReport = (): PrintableReportData => {
    const monthlySales = sales.filter((sale) => sale.soldAt.startsWith(profitMonth));
    const aggregate = new Map<
      string,
      { receipts: number; units: number; revenue: number; cost: number }
    >();

    monthlySales.forEach((sale) => {
      const dayKey = sale.soldAt.slice(0, 10);
      const current = aggregate.get(dayKey) ?? {
        receipts: 0,
        units: 0,
        revenue: 0,
        cost: 0,
      };

      current.receipts += 1;
      current.units += sale.totalQuantity;
      current.revenue += getSaleGrandTotal(sale);
      current.cost += sale.items.reduce((total, item) => total + (item.lineCost ?? 0), 0);
      aggregate.set(dayKey, current);
    });

    const rows = [...aggregate.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([dateKey, values]) => {
        const grossProfit = values.revenue - values.cost;
        const margin = values.revenue > 0 ? grossProfit / values.revenue : 0;

        return {
          dateKey,
          ...values,
          grossProfit,
          margin,
        };
      });

    const totalRevenue = rows.reduce((total, row) => total + row.revenue, 0);
    const totalCost = rows.reduce((total, row) => total + row.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

    return {
      title: 'Profit Report',
      subtitle: 'Gross profit view by day within the selected month.',
      filters: [
        { label: 'Month', value: formatMonthLabel(profitMonth) },
        { label: 'Profit Basis', value: 'Revenue less captured item cost' },
      ],
      metrics: [
        { label: 'Revenue', value: formatCurrency(totalRevenue) },
        { label: 'Cost', value: formatCurrency(totalCost) },
        { label: 'Gross Profit', value: formatCurrency(totalProfit) },
        { label: 'Margin', value: formatPercent(totalMargin) },
      ],
      columns: [
        { label: 'Date' },
        { label: 'Receipts', align: 'right' },
        { label: 'Units', align: 'right' },
        { label: 'Revenue', align: 'right' },
        { label: 'Cost', align: 'right' },
        { label: 'Gross Profit', align: 'right' },
        { label: 'Margin', align: 'right' },
      ],
      rows: rows.map((row) => [
        formatDate(row.dateKey),
        formatNumber(row.receipts),
        formatNumber(row.units),
        formatCurrency(row.revenue),
        formatCurrency(row.cost),
        formatCurrency(row.grossProfit),
        formatPercent(row.margin),
      ]),
      emptyMessage: 'No sales are available to calculate profit for the selected month.',
    };
  };

  const reportData =
    reportKey === 'daily-sales'
      ? buildDailySalesReport()
      : reportKey === 'monthly-sales'
        ? buildMonthlySalesReport()
        : reportKey === 'stock-balance'
          ? buildStockBalanceReport()
          : reportKey === 'low-stock'
            ? buildLowStockReport()
            : reportKey === 'best-selling'
              ? buildBestSellingReport()
              : buildProfitReport();

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            onClick={() => printReport(reportData, settings)}
            startIcon={<PrintOutlinedIcon />}
            variant="contained"
          >
            Print Report
          </Button>
        }
        description="Switch between the main operational reports, apply a small practical filter set, and print the current view when needed."
        title="Reports"
      />

      <DataCard
        description="Each report keeps its filter surface intentionally small so the results stay fast to read and practical to print."
        title="Report Filters"
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            p: 3,
          }}
        >
          <TextField
            label="Report"
            onChange={(event) => setReportKey(event.target.value as ReportKey)}
            select
            value={reportKey}
          >
            {reportOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {reportKey === 'daily-sales' && (
            <TextField
              label="Date"
              onChange={(event) => setDailyDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={dailyDate}
            />
          )}

          {reportKey === 'monthly-sales' && (
            <TextField
              label="Month"
              onChange={(event) => setMonthFilter(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="month"
              value={monthFilter}
            />
          )}

          {reportKey === 'stock-balance' && (
            <>
              <TextField
                label="Search"
                onChange={(event) => setStockSearch(event.target.value)}
                placeholder="Product, SKU, brand, color"
                value={stockSearch}
              />
              <TextField
                label="Status"
                onChange={(event) =>
                  setStockStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
                }
                select
                value={stockStatusFilter}
              >
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </TextField>
            </>
          )}

          {reportKey === 'low-stock' && (
            <>
              <TextField
                label="Search"
                onChange={(event) => setLowStockSearch(event.target.value)}
                placeholder="Product, SKU, size, color"
                value={lowStockSearch}
              />
              <TextField
                label="Alert Mode"
                onChange={(event) =>
                  setLowStockMode(
                    event.target.value as 'all-alerts' | 'low-only' | 'out-of-stock',
                  )
                }
                select
                value={lowStockMode}
              >
                <MenuItem value="all-alerts">All Alerts</MenuItem>
                <MenuItem value="low-only">Low Stock Only</MenuItem>
                <MenuItem value="out-of-stock">Out of Stock Only</MenuItem>
              </TextField>
            </>
          )}

          {reportKey === 'best-selling' && (
            <>
              <TextField
                label="Month"
                onChange={(event) => setBestSellingMonth(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                type="month"
                value={bestSellingMonth}
              />
              <TextField
                label="Top Rows"
                onChange={(event) => setBestSellingLimit(event.target.value)}
                select
                value={bestSellingLimit}
              >
                <MenuItem value="5">Top 5</MenuItem>
                <MenuItem value="10">Top 10</MenuItem>
                <MenuItem value="20">Top 20</MenuItem>
              </TextField>
            </>
          )}

          {reportKey === 'profit' && (
            <TextField
              label="Month"
              onChange={(event) => setProfitMonth(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="month"
              value={profitMonth}
            />
          )}
        </Box>
      </DataCard>

      <DataCard
        actions={
          <Button
            onClick={() => printReport(reportData, settings)}
            startIcon={<SummarizeOutlinedIcon />}
            variant="outlined"
          >
            Print Current View
          </Button>
        }
        description="The preview below matches the printable report output."
        title={reportData.title}
      >
        <Box sx={{ p: 3 }}>
          <ReportPreviewCard report={reportData} />
        </Box>
      </DataCard>
    </Stack>
  );
}
