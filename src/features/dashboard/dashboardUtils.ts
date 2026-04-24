import { getSaleGrandTotal } from '../../services/salesService';
import type {
  Brand,
  PaymentMethod,
  Product,
  ProductVariant,
  SaleRecord,
} from '../../types/models';

export interface DashboardTrendPoint {
  key: string;
  label: string;
  value: number;
  transactionCount: number;
}

export interface DashboardPerformanceItem {
  id: string;
  label: string;
  sublabel: string;
  value: number;
  quantity: number;
  progress: number;
  chipLabel?: string;
}

export interface DashboardInventoryItem {
  id: string;
  label: string;
  sublabel: string;
  stockQty: number;
  minStock: number;
  stockValue: number;
}

export interface DashboardStockValueItem {
  id: string;
  label: string;
  stockUnits: number;
  value: number;
}

export interface DashboardRecentSaleItem {
  id: string;
  receiptNo: string;
  soldAt: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  total: number;
  totalQuantity: number;
}

export interface DashboardCashierSummaryItem {
  id: string;
  label: string;
  revenue: number;
  transactions: number;
  averageSaleValue: number;
}

export interface DashboardPaymentSummaryItem {
  id: PaymentMethod;
  label: string;
  revenue: number;
  transactions: number;
  share: number;
}

export interface DashboardAnalytics {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  todayAverageSaleValue: number;
  itemsSoldToday: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryStockValue: number;
  inventoryUnits: number;
  dailySalesTrend: DashboardTrendPoint[];
  weeklySalesSummary: DashboardTrendPoint[];
  monthlySalesSummary: DashboardTrendPoint[];
  topSellingProducts: DashboardPerformanceItem[];
  topSellingBrands: DashboardPerformanceItem[];
  slowMovingProducts: DashboardPerformanceItem[];
  outOfStockProducts: DashboardPerformanceItem[];
  lowStockWatchlist: DashboardInventoryItem[];
  outOfStockList: DashboardInventoryItem[];
  highestStockItems: DashboardInventoryItem[];
  stockValueByBrand: DashboardStockValueItem[];
  businessSummary: {
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
    averageSaleValue: number;
    transactions: number;
  };
  recentSales: DashboardRecentSaleItem[];
  salesByCashier: DashboardCashierSummaryItem[];
  paymentMethodSummary: DashboardPaymentSummaryItem[];
}

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function getDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekStart(value: string | Date) {
  const date = startOfDay(value instanceof Date ? value : new Date(value));
  const dayIndex = (date.getDay() + 6) % 7;

  date.setDate(date.getDate() - dayIndex);

  return date;
}

function getWeekKey(value: string | Date) {
  return getDayKey(getWeekStart(value));
}

function getSaleCost(sale: SaleRecord) {
  return sale.items.reduce(
    (total, item) =>
      total + (Number(item.lineCost) || Number(item.unitCost) * Number(item.quantity) || 0),
    0,
  );
}

interface BuildDashboardAnalyticsInput {
  brands: Brand[];
  products: Product[];
  variants: ProductVariant[];
  sales: SaleRecord[];
}

export function buildDashboardAnalytics({
  brands,
  products,
  variants,
  sales,
}: BuildDashboardAnalyticsInput): DashboardAnalytics {
  const effectiveSales = sales;
  const productMap = new Map(products.map((product) => [product.id, product]));
  const brandMap = new Map(brands.map((brand) => [brand.id, brand]));
  const stockUnitsByProductId = new Map<string, number>();

  for (const variant of variants) {
    stockUnitsByProductId.set(
      variant.productId,
      (stockUnitsByProductId.get(variant.productId) ?? 0) + variant.stockQty,
    );
  }

  const today = startOfDay(new Date());
  const todayKey = getDayKey(today);
  const currentMonthKey = getMonthKey(today);

  const dayTotals = new Map<string, { revenue: number; transactions: number }>();
  const weekTotals = new Map<string, { revenue: number; transactions: number }>();
  const monthTotals = new Map<string, { revenue: number; transactions: number }>();
  const productSales = new Map<
    string,
    {
      quantity: number;
      revenue: number;
      stockUnits: number;
      brandName: string;
      lastSoldAt: string | null;
    }
  >();
  const brandSales = new Map<
    string,
    { quantity: number; revenue: number; transactions: number; label: string }
  >();
  const cashierSales = new Map<string, { revenue: number; transactions: number; label: string }>();
  const paymentSummary = new Map<PaymentMethod, { revenue: number; transactions: number }>([
    ['cash', { revenue: 0, transactions: 0 }],
    ['card', { revenue: 0, transactions: 0 }],
    ['transfer', { revenue: 0, transactions: 0 }],
  ]);
  const soldLast30Days = new Map<string, number>();

  let todaySales = 0;
  let todayProfit = 0;
  let todayTransactions = 0;
  let itemsSoldToday = 0;
  let currentMonthRevenue = 0;
  let currentMonthCost = 0;
  let currentMonthTransactions = 0;

  const thirtyDaysAgo = addDays(today, -29);

  for (const sale of effectiveSales) {
    const saleTotal = getSaleGrandTotal(sale);
    const saleCost = getSaleCost(sale);
    const saleProfit = saleTotal - saleCost;
    const saleDayKey = getDayKey(sale.soldAt);
    const saleWeekKey = getWeekKey(sale.soldAt);
    const saleMonthKey = getMonthKey(sale.soldAt);

    if (saleDayKey === todayKey) {
      todaySales += saleTotal;
      todayProfit += saleProfit;
      todayTransactions += 1;
      itemsSoldToday += sale.totalQuantity;
    }

    if (saleMonthKey === currentMonthKey) {
      currentMonthRevenue += saleTotal;
      currentMonthCost += saleCost;
      currentMonthTransactions += 1;
    }

    if (new Date(sale.soldAt) >= thirtyDaysAgo) {
      for (const item of sale.items) {
        soldLast30Days.set(item.productId, (soldLast30Days.get(item.productId) ?? 0) + item.quantity);
      }
    }

    const dayEntry = dayTotals.get(saleDayKey) ?? { revenue: 0, transactions: 0 };
    dayEntry.revenue += saleTotal;
    dayEntry.transactions += 1;
    dayTotals.set(saleDayKey, dayEntry);

    const weekEntry = weekTotals.get(saleWeekKey) ?? { revenue: 0, transactions: 0 };
    weekEntry.revenue += saleTotal;
    weekEntry.transactions += 1;
    weekTotals.set(saleWeekKey, weekEntry);

    const monthEntry = monthTotals.get(saleMonthKey) ?? { revenue: 0, transactions: 0 };
    monthEntry.revenue += saleTotal;
    monthEntry.transactions += 1;
    monthTotals.set(saleMonthKey, monthEntry);

    const cashierEntry = cashierSales.get(sale.cashierName) ?? {
      label: sale.cashierName,
      revenue: 0,
      transactions: 0,
    };
    cashierEntry.revenue += saleTotal;
    cashierEntry.transactions += 1;
    cashierSales.set(sale.cashierName, cashierEntry);

    const paymentEntry = paymentSummary.get(sale.paymentMethod);

    if (paymentEntry) {
      paymentEntry.revenue += saleTotal;
      paymentEntry.transactions += 1;
    }

    for (const item of sale.items) {
      const product = productMap.get(item.productId);
      const brand = product ? brandMap.get(product.brandId) : undefined;
      const stockUnits = stockUnitsByProductId.get(item.productId) ?? 0;
      const productEntry = productSales.get(item.productId) ?? {
        quantity: 0,
        revenue: 0,
        stockUnits,
        brandName: brand?.name ?? 'Unknown brand',
        lastSoldAt: null,
      };

      productEntry.quantity += item.quantity;
      productEntry.revenue += item.lineTotal;
      productEntry.lastSoldAt =
        productEntry.lastSoldAt && productEntry.lastSoldAt > sale.soldAt
          ? productEntry.lastSoldAt
          : sale.soldAt;
      productSales.set(item.productId, productEntry);

      if (!product) {
        continue;
      }

      const brandEntry = brandSales.get(product.brandId) ?? {
        label: brand?.name ?? 'Unknown brand',
        quantity: 0,
        revenue: 0,
        transactions: 0,
      };
      brandEntry.quantity += item.quantity;
      brandEntry.revenue += item.lineTotal;
      brandEntry.transactions += 1;
      brandSales.set(product.brandId, brandEntry);
    }
  }

  const inventoryUnits = variants.reduce((total, variant) => total + variant.stockQty, 0);
  const inventoryStockValue = variants.reduce(
    (total, variant) => total + variant.stockQty * variant.costPrice,
    0,
  );
  const lowStockVariants = variants
    .filter((variant) => variant.stockQty <= variant.minStock)
    .sort((left, right) => {
      if (left.stockQty === 0 && right.stockQty > 0) {
        return -1;
      }

      if (right.stockQty === 0 && left.stockQty > 0) {
        return 1;
      }

      return left.stockQty - right.stockQty;
    });
  const outOfStockVariants = variants.filter((variant) => variant.stockQty === 0);
  const lowStockCount = lowStockVariants.length;
  const outOfStockCount = outOfStockVariants.length;

  const lowStockWatchlist = lowStockVariants.slice(0, 6).map((variant) => {
    const product = productMap.get(variant.productId);
    const brand = product ? brandMap.get(product.brandId) : undefined;

    return {
      id: variant.id,
      label: product?.name ?? variant.sku,
      sublabel: `${brand?.name ?? 'Unknown brand'} - Size ${variant.size} - ${variant.color}`,
      stockQty: variant.stockQty,
      minStock: variant.minStock,
      stockValue: variant.stockQty * variant.costPrice,
    };
  });

  const outOfStockList = outOfStockVariants.slice(0, 6).map((variant) => {
    const product = productMap.get(variant.productId);
    const brand = product ? brandMap.get(product.brandId) : undefined;

    return {
      id: variant.id,
      label: product?.name ?? variant.sku,
      sublabel: `${brand?.name ?? 'Unknown brand'} - Size ${variant.size} - ${variant.color}`,
      stockQty: variant.stockQty,
      minStock: variant.minStock,
      stockValue: 0,
    };
  });

  const highestStockItems = [...variants]
    .sort((left, right) => right.stockQty - left.stockQty)
    .slice(0, 6)
    .map((variant) => {
      const product = productMap.get(variant.productId);
      const brand = product ? brandMap.get(product.brandId) : undefined;

      return {
        id: variant.id,
        label: product?.name ?? variant.sku,
        sublabel: `${brand?.name ?? 'Unknown brand'} - Size ${variant.size} - ${variant.color}`,
        stockQty: variant.stockQty,
        minStock: variant.minStock,
        stockValue: variant.stockQty * variant.costPrice,
      };
    });

  const stockValueByBrand = brands
    .map((brand) => {
      const brandVariants = variants.filter(
        (variant) => productMap.get(variant.productId)?.brandId === brand.id,
      );

      return {
        id: brand.id,
        label: brand.name,
        stockUnits: brandVariants.reduce((total, variant) => total + variant.stockQty, 0),
        value: brandVariants.reduce(
          (total, variant) => total + variant.stockQty * variant.costPrice,
          0,
        ),
      };
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);

  const topProductMax = Math.max(
    ...Array.from(productSales.values()).map((entry) => entry.quantity),
    0,
  );
  const topSellingProducts = Array.from(productSales.entries())
    .sort((left, right) => {
      if (right[1].quantity !== left[1].quantity) {
        return right[1].quantity - left[1].quantity;
      }

      return right[1].revenue - left[1].revenue;
    })
    .slice(0, 5)
    .map(([productId, entry]) => ({
      id: productId,
      label: productMap.get(productId)?.name ?? 'Unknown product',
      sublabel: `${entry.brandName} - ${entry.stockUnits} units on hand`,
      value: entry.revenue,
      quantity: entry.quantity,
      progress: topProductMax > 0 ? (entry.quantity / topProductMax) * 100 : 0,
      chipLabel: `${entry.quantity} sold`,
    }));

  const topBrandMax = Math.max(...Array.from(brandSales.values()).map((entry) => entry.revenue), 0);
  const topSellingBrands = Array.from(brandSales.entries())
    .sort((left, right) => right[1].revenue - left[1].revenue)
    .slice(0, 5)
    .map(([brandId, entry]) => ({
      id: brandId,
      label: entry.label,
      sublabel: `${entry.transactions} sales lines - ${entry.quantity} items sold`,
      value: entry.revenue,
      quantity: entry.quantity,
      progress: topBrandMax > 0 ? (entry.revenue / topBrandMax) * 100 : 0,
      chipLabel: `${entry.quantity} sold`,
    }));

  const slowMovingCandidates = products.map((product) => {
    const productEntry = productSales.get(product.id);
    const stockUnits = stockUnitsByProductId.get(product.id) ?? 0;
    const soldQuantity = soldLast30Days.get(product.id) ?? 0;
    const brand = brandMap.get(product.brandId);

    return {
      id: product.id,
      label: product.name,
      sublabel: productEntry?.lastSoldAt
        ? `${brand?.name ?? 'Unknown brand'} - Last sold ${dayFormatter.format(new Date(productEntry.lastSoldAt))}`
        : `${brand?.name ?? 'Unknown brand'} - No sales recorded yet`,
      value: soldQuantity,
      quantity: stockUnits,
    };
  });
  const slowMovingMaxStock = Math.max(...slowMovingCandidates.map((entry) => entry.quantity), 0);
  const slowMovingProducts = slowMovingCandidates
    .sort((left, right) => {
      if (left.value !== right.value) {
        return left.value - right.value;
      }

      return right.quantity - left.quantity;
    })
    .slice(0, 5)
    .map((entry) => ({
      ...entry,
      progress: slowMovingMaxStock > 0 ? (entry.quantity / slowMovingMaxStock) * 100 : 0,
      chipLabel: `${entry.quantity} on hand`,
    }));

  const outOfStockProducts = products
    .map((product) => {
      const productVariants = variants.filter((variant) => variant.productId === product.id);
      const totalStock = productVariants.reduce((total, variant) => total + variant.stockQty, 0);
      const brand = brandMap.get(product.brandId);

      return {
        id: product.id,
        label: product.name,
        sublabel: `${brand?.name ?? 'Unknown brand'} - ${productVariants.length} variants tracked`,
        value: totalStock,
        quantity: productVariants.length,
      };
    })
    .filter((product) => product.value === 0)
    .slice(0, 5)
    .map((entry) => ({
      ...entry,
      progress: 100,
      chipLabel: 'Out of stock',
    }));

  const dailySalesTrend = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    const key = getDayKey(date);
    const entry = dayTotals.get(key) ?? { revenue: 0, transactions: 0 };

    return {
      key,
      label: dayFormatter.format(date),
      value: entry.revenue,
      transactionCount: entry.transactions,
    };
  });

  const currentWeekStart = getWeekStart(today);
  const weeklySalesSummary = Array.from({ length: 8 }, (_, index) => {
    const weekStart = addDays(currentWeekStart, (index - 7) * 7);
    const key = getDayKey(weekStart);
    const entry = weekTotals.get(key) ?? { revenue: 0, transactions: 0 };

    return {
      key,
      label: `Wk ${dayFormatter.format(weekStart)}`,
      value: entry.revenue,
      transactionCount: entry.transactions,
    };
  });

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlySalesSummary = Array.from({ length: 6 }, (_, index) => {
    const monthStart = addMonths(currentMonthStart, index - 5);
    const key = getMonthKey(monthStart);
    const entry = monthTotals.get(key) ?? { revenue: 0, transactions: 0 };

    return {
      key,
      label: monthFormatter.format(monthStart),
      value: entry.revenue,
      transactionCount: entry.transactions,
    };
  });

  const recentSales = [...effectiveSales]
    .sort((left, right) => right.soldAt.localeCompare(left.soldAt))
    .slice(0, 6)
    .map((sale) => ({
      id: sale.id,
      receiptNo: sale.receiptNo,
      soldAt: sale.soldAt,
      cashierName: sale.cashierName,
      paymentMethod: sale.paymentMethod,
      total: getSaleGrandTotal(sale),
      totalQuantity: sale.totalQuantity,
    }));

  const salesByCashier = Array.from(cashierSales.entries())
    .map(([cashierName, entry]) => ({
      id: cashierName,
      label: entry.label,
      revenue: entry.revenue,
      transactions: entry.transactions,
      averageSaleValue: entry.transactions > 0 ? entry.revenue / entry.transactions : 0,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  const paymentMethodSummary = Array.from(paymentSummary.entries())
    .map(([paymentMethod, entry]) => ({
      id: paymentMethod,
      label:
        paymentMethod === 'cash'
          ? 'Cash'
          : paymentMethod === 'card'
            ? 'Card'
            : 'Transfer',
      revenue: entry.revenue,
      transactions: entry.transactions,
      share: effectiveSales.length > 0 ? entry.transactions / effectiveSales.length : 0,
    }))
    .sort((left, right) => right.revenue - left.revenue);

  return {
    todaySales,
    todayProfit,
    todayTransactions,
    todayAverageSaleValue: todayTransactions > 0 ? todaySales / todayTransactions : 0,
    itemsSoldToday,
    lowStockCount,
    outOfStockCount,
    inventoryStockValue,
    inventoryUnits,
    dailySalesTrend,
    weeklySalesSummary,
    monthlySalesSummary,
    topSellingProducts,
    topSellingBrands,
    slowMovingProducts,
    outOfStockProducts,
    lowStockWatchlist,
    outOfStockList,
    highestStockItems,
    stockValueByBrand,
    businessSummary: {
      revenue: currentMonthRevenue,
      cost: currentMonthCost,
      profit: currentMonthRevenue - currentMonthCost,
      profitMargin:
        currentMonthRevenue > 0
          ? (currentMonthRevenue - currentMonthCost) / currentMonthRevenue
          : 0,
      averageSaleValue:
        currentMonthTransactions > 0 ? currentMonthRevenue / currentMonthTransactions : 0,
      transactions: currentMonthTransactions,
    },
    recentSales,
    salesByCashier,
    paymentMethodSummary,
  };
}
