import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { printSaleReceipt } from '../../services/receiptPrint';
import { SaleReceiptCard } from '../sales/SaleReceiptCard';
import { CartPanel } from './components/CartPanel';
import { CheckoutActionBar } from './components/CheckoutActionBar';
import { DesktopPosLayout } from './components/DesktopPosLayout';
import { MobilePosLayout } from './components/MobilePosLayout';
import { PaymentPanel } from './components/PaymentPanel';
import { ProductGrid } from './components/ProductGrid';
import { ReceiptPreviewDialog } from './components/ReceiptPreviewDialog';
import { TabletPosLayout } from './components/TabletPosLayout';
import { VariantSelectorDialog } from './components/VariantSelectorDialog';
import type { PosCartDetail, PosCartLine, PosProductGroup } from './types';
import type { PaymentMethod, ProductVariant } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

function sortSizeValue(left: string, right: string) {
  const leftNumber = Number.parseFloat(left);
  const rightNumber = Number.parseFloat(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right, undefined, { numeric: true });
}

function getQuickAddVariant(
  product: PosProductGroup,
  cartQuantityMap: Record<string, number>,
) {
  const availableVariants = product.variants.filter(
    (variant) => variant.stockQty - (cartQuantityMap[variant.id] ?? 0) > 0,
  );

  return availableVariants.length === 1 ? availableVariants[0] : null;
}

export function PosPage() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = !isPhone && !isDesktop;
  const { session, settings } = useAuth();
  const { brands, categories, products, variants, sales, createSale } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PosProductGroup | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [tabletCartOpen, setTabletCartOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);
  const [clearCartOpen, setClearCartOpen] = useState(false);

  const brandMap = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );
  const variantMap = useMemo(
    () => Object.fromEntries(variants.map((variant) => [variant.id, variant])),
    [variants],
  );

  const activeVariants = useMemo(
    () =>
      variants.filter((variant) => {
        const product = productMap[variant.productId];

        return Boolean(product && product.status === 'active' && variant.status === 'active');
      }),
    [productMap, variants],
  );

  const cartQuantityMap = useMemo(
    () => Object.fromEntries(cart.map((item) => [item.variantId, item.quantity])),
    [cart],
  );

  const visibleProducts = useMemo(() => {
    const grouped = new Map<string, ProductVariant[]>();
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    for (const variant of activeVariants) {
      const product = productMap[variant.productId];

      if (!product) {
        continue;
      }

      if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) {
        continue;
      }

      const matchesQuery =
        !normalizedQuery ||
        [
          product.name,
          product.styleCode,
          brandMap[product.brandId] ?? '',
          categoryMap[product.categoryId] ?? '',
          variant.sku,
          variant.barcode ?? '',
          variant.size,
          variant.color,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      if (!matchesQuery) {
        continue;
      }

      const currentGroup = grouped.get(product.id) ?? [];
      currentGroup.push(variant);
      grouped.set(product.id, currentGroup);
    }

    return Array.from(grouped.entries())
      .map(([productId, groupedVariants]) => {
        const product = productMap[productId]!;
        const sortedVariants = [...groupedVariants].sort(
          (left, right) =>
            left.color.localeCompare(right.color) || sortSizeValue(left.size, right.size),
        );

        return {
          id: product.id,
          product,
          brandName: brandMap[product.brandId] ?? '-',
          categoryName: categoryMap[product.categoryId] ?? '-',
          variants: sortedVariants,
          totalStock: sortedVariants.reduce((total, variant) => total + variant.stockQty, 0),
          availableVariantCount: sortedVariants.filter((variant) => variant.stockQty > 0).length,
          lowestPrice: Math.min(...sortedVariants.map((variant) => variant.sellingPrice)),
          hasLowStock: sortedVariants.some(
            (variant) => variant.stockQty > 0 && variant.stockQty <= variant.minStock,
          ),
          hasOutOfStock: sortedVariants.some((variant) => variant.stockQty === 0),
        } satisfies PosProductGroup;
      })
      .sort((left, right) => left.product.name.localeCompare(right.product.name));
  }, [activeVariants, brandMap, categoryFilter, categoryMap, deferredSearchQuery, productMap]);

  const cartDetails = useMemo(
    () =>
      cart
        .map((item) => {
          const variant = variantMap[item.variantId];
          const product = variant ? productMap[variant.productId] : undefined;

          if (!variant || !product) {
            return null;
          }

          return {
            id: item.variantId,
            product,
            variant,
            brandName: brandMap[product.brandId] ?? '-',
            categoryName: categoryMap[product.categoryId] ?? '-',
            quantity: item.quantity,
            lineTotal: item.quantity * variant.sellingPrice,
          } satisfies PosCartDetail;
        })
        .filter((entry): entry is PosCartDetail => Boolean(entry)),
    [brandMap, cart, categoryMap, productMap, variantMap],
  );

  const subtotal = cartDetails.reduce((total, item) => total + item.lineTotal, 0);
  const normalizedDiscountAmount = Math.max(discountAmount, 0);
  const totalAmount = Math.max(subtotal - normalizedDiscountAmount, 0);
  const totalQuantity = cartDetails.reduce((total, item) => total + item.quantity, 0);
  const shortAmount = Math.max(totalAmount - paidAmount, 0);
  const changeAmount = Math.max(paidAmount - totalAmount, 0);
  const canCheckout = cartDetails.length > 0 && shortAmount === 0;
  const lastSale = sales.find((sale) => sale.id === lastSaleId) ?? null;
  const checkoutTone = cartDetails.length === 0 ? 'warning' : shortAmount > 0 ? 'error' : 'success';
  const checkoutMessage =
    cartDetails.length === 0
      ? 'Cart is empty. Add a product to start checkout.'
      : shortAmount > 0
        ? 'Payment is not enough yet. Collect the remaining amount before checkout.'
        : 'Ready to checkout. Stock and payment are valid.';

  useEffect(() => {
    if (cart.length === 0) {
      setPaymentMethod('cash');
      setCustomerName('');
      setDiscountAmount(0);
      setPaidAmount(0);
      setNote('');
      return;
    }

    if (paymentMethod !== 'cash') {
      setPaidAmount(totalAmount);
      return;
    }

    if (paidAmount === 0) {
      setPaidAmount(totalAmount);
    }
  }, [cart.length, paidAmount, paymentMethod, totalAmount]);

  const pushFeedback = (severity: AlertColor, message: string) => {
    setFeedback({ severity, message });
  };

  const addToCart = (variantId: string) => {
    const variant = variantMap[variantId];
    const product = variant ? productMap[variant.productId] : undefined;
    const currentQuantity = cartQuantityMap[variantId] ?? 0;

    if (!variant || !product) {
      pushFeedback('error', 'The selected variant is no longer available.');
      return;
    }

    if (currentQuantity >= variant.stockQty) {
      pushFeedback(
        'error',
        `${product.name} ${variant.size}/${variant.color} cannot exceed available stock.`,
      );
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.variantId === variantId);

      if (!existing) {
        return [...current, { variantId, quantity: 1 }];
      }

      return current.map((item) =>
        item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });

    setSelectedProduct(null);
    setLastSaleId(null);
    setFeedback(null);
  };

  const decreaseCartItem = (variantId: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.variantId === variantId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
    setLastSaleId(null);
  };

  const increaseCartItem = (variantId: string) => {
    const variant = variantMap[variantId];
    const product = variant ? productMap[variant.productId] : undefined;
    const currentQuantity = cartQuantityMap[variantId] ?? 0;

    if (!variant || !product) {
      pushFeedback('error', 'The selected cart item is no longer available.');
      return;
    }

    if (currentQuantity >= variant.stockQty) {
      pushFeedback(
        'error',
        `${product.name} ${variant.size}/${variant.color} cannot exceed available stock.`,
      );
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
    setLastSaleId(null);
    setFeedback(null);
  };

  const removeCartItem = (variantId: string) => {
    setCart((current) => current.filter((item) => item.variantId !== variantId));
    setLastSaleId(null);
  };

  const handleSearchSubmit = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return;
    }

    const exactVariantMatches = activeVariants.filter((variant) =>
      [variant.sku, variant.barcode ?? '']
        .filter(Boolean)
        .some((value) => value.trim().toLowerCase() === normalizedQuery),
    );

    if (exactVariantMatches.length === 1) {
      addToCart(exactVariantMatches[0].id);
      setSearchQuery('');
      return;
    }

    if (visibleProducts.length === 1) {
      const quickAddVariant = getQuickAddVariant(visibleProducts[0], cartQuantityMap);

      if (quickAddVariant) {
        addToCart(quickAddVariant.id);
        setSearchQuery('');
        return;
      }

      setSelectedProduct(visibleProducts[0]);
      return;
    }

    pushFeedback(
      'info',
      'Multiple matches found. Pick the product card to choose the correct size and color.',
    );
  };

  const resetProductFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
  };

  const clearCart = () => {
    setCart([]);
    setSelectedProduct(null);
    setLastSaleId(null);
    setClearCartOpen(false);
    pushFeedback('info', 'Cart cleared.');
  };

  const handleCheckout = () => {
    if (!session) {
      pushFeedback('error', 'Sign in again before processing a sale.');
      return;
    }

    if (cartDetails.length === 0) {
      pushFeedback('error', 'Add at least one item to the cart before checkout.');
      return;
    }

    const invalidItem = cartDetails.find((item) => item.quantity > item.variant.stockQty);

    if (invalidItem) {
      pushFeedback(
        'error',
        `${invalidItem.product.name} ${invalidItem.variant.size}/${invalidItem.variant.color} no longer has enough stock.`,
      );
      return;
    }

    if (paidAmount < totalAmount) {
      pushFeedback('error', 'Paid amount must cover the grand total.');
      return;
    }

    const result = createSale({
      cashierId: session.id,
      cashierName: session.name,
      customerName,
      paymentMethod,
      discountAmount: normalizedDiscountAmount,
      paidAmount,
      note,
      items: cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });

    pushFeedback(result.ok ? 'success' : 'error', result.message);

    if (!result.ok) {
      return;
    }

    setLastSaleId(result.recordId ?? null);
    setReceiptOpen(true);
    setCart([]);
    setSearchQuery('');
    setCategoryFilter('all');
    setSelectedProduct(null);
    setTabletCartOpen(false);
    setMobileTab(0);
  };

  const productsPanel = (
    <ProductGrid
      cartQuantityMap={cartQuantityMap}
      categories={categories
        .filter((category) => category.status === 'active')
        .map((category) => ({ id: category.id, name: category.name }))}
      categoryFilter={categoryFilter}
      onCategoryChange={setCategoryFilter}
      onSearchChange={setSearchQuery}
      onQuickAddVariant={addToCart}
      onResetFilters={resetProductFilters}
      onSearchSubmit={handleSearchSubmit}
      onSelectProduct={setSelectedProduct}
      products={visibleProducts}
      searchQuery={searchQuery}
    />
  );

  const cartPanel = (
    <CartPanel
      items={cartDetails}
      maxHeight={isDesktop ? 360 : isTablet ? '42vh' : undefined}
      onClearCart={() => setClearCartOpen(true)}
      onDecrease={decreaseCartItem}
      onIncrease={increaseCartItem}
      onRemove={removeCartItem}
      totalQuantity={totalQuantity}
    />
  );

  const paymentPanel = (
    <PaymentPanel
      canCheckout={canCheckout}
      changeAmount={changeAmount}
      checkoutMessage={checkoutMessage}
      checkoutTone={checkoutTone}
      customerName={customerName}
      discountAmount={normalizedDiscountAmount}
      lineCount={cartDetails.length}
      note={note}
      onCheckout={handleCheckout}
      onCustomerNameChange={setCustomerName}
      onDiscountAmountChange={setDiscountAmount}
      onNoteChange={setNote}
      onPaidAmountChange={setPaidAmount}
      onPaymentMethodChange={setPaymentMethod}
      onUseExactAmount={() => setPaidAmount(totalAmount)}
      paidAmount={paidAmount}
      paymentMethod={paymentMethod}
      shortAmount={shortAmount}
      subtotal={subtotal}
      totalAmount={totalAmount}
      totalQuantity={totalQuantity}
    />
  );

  const liveSaleSummary = (
    <Box
      sx={{
        backgroundColor: 'primary.light',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.25,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        Current sale
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.35 }} variant="h5">
        {formatCurrency(totalAmount)}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
        {checkoutMessage}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 1.25,
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          mt: 2,
        }}
      >
        <LiveMetric label="Units" value={formatNumber(totalQuantity)} />
        <LiveMetric label="Discount" value={formatCurrency(normalizedDiscountAmount)} />
        <LiveMetric label="Paid" value={formatCurrency(paidAmount)} />
      </Box>
    </Box>
  );

  return (
    <Stack spacing={3} sx={{ pb: isDesktop ? 0 : 11 }}>
      <PageHeader
        action={
          <Chip
            color={session?.role === 'cashier' ? 'secondary' : 'primary'}
            label={session?.role === 'cashier' ? 'Cashier Mode' : 'Admin POS'}
            size="small"
          />
        }
        description="Responsive point-of-sale workflow for fast product search, variant picking, touch-friendly cart updates, and immediate receipt handling."
        title="POS"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      {isDesktop ? (
        <DesktopPosLayout
          products={productsPanel}
          sidebar={
            <Stack spacing={2}>
              {cartPanel}
              {paymentPanel}
            </Stack>
          }
          summary={liveSaleSummary}
        />
      ) : isTablet ? (
        <TabletPosLayout
          actionBar={
            <CheckoutActionBar
              itemCount={totalQuantity}
              onOpenCart={() => setTabletCartOpen(true)}
              onOpenCheckout={() => setTabletCartOpen(true)}
              totalAmount={totalAmount}
            />
          }
          drawerContent={
            <Stack spacing={2}>
              {cartPanel}
              {paymentPanel}
            </Stack>
          }
          drawerOpen={tabletCartOpen}
          onCloseDrawer={() => setTabletCartOpen(false)}
          products={productsPanel}
        />
      ) : (
        <MobilePosLayout
          actionBar={
            <CheckoutActionBar
              itemCount={totalQuantity}
              onOpenCart={() => setMobileTab(1)}
              onOpenCheckout={() => setMobileTab(2)}
              totalAmount={totalAmount}
            />
          }
          activeTab={mobileTab}
          cart={cartPanel}
          checkout={paymentPanel}
          itemCount={totalQuantity}
          onTabChange={setMobileTab}
          products={productsPanel}
          totalAmount={totalAmount}
        />
      )}

      <VariantSelectorDialog
        cartQuantityMap={cartQuantityMap}
        onAddVariant={addToCart}
        onClose={() => setSelectedProduct(null)}
        open={Boolean(selectedProduct)}
        product={selectedProduct}
      />

      <ReceiptPreviewDialog
        onClose={() => setReceiptOpen(false)}
        open={receiptOpen}
        sale={lastSale}
      />

      <ConfirmDialog
        confirmLabel="Clear cart"
        description="This removes all current cart lines and resets the active checkout values."
        onClose={() => setClearCartOpen(false)}
        onConfirm={clearCart}
        open={clearCartOpen}
        title="Clear current cart?"
      />

      {lastSale && (
        <DataCard
          actions={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                component={RouterLink}
                startIcon={<VisibilityOutlinedIcon />}
                to={`/sales/${lastSale.id}`}
                variant="outlined"
              >
                View Sale
              </Button>
              <Button
                onClick={() => printSaleReceipt(lastSale, settings)}
                startIcon={<PrintOutlinedIcon />}
                variant="contained"
              >
                Print Receipt
              </Button>
            </Stack>
          }
          description="Latest completed sale. The cart is cleared and the receipt is ready from any screen size."
          title="Last Receipt"
        >
          <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {lastSale.receiptNo}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Cashier {lastSale.cashierName}
                  {lastSale.customerName ? ` | Customer ${lastSale.customerName}` : ''}
                </Typography>
              </Box>
              <Chip
                icon={<PointOfSaleOutlinedIcon fontSize="small" />}
                label={`${formatNumber(lastSale.totalQuantity)} units | ${formatCurrency(lastSale.totalAmount ?? lastSale.subtotal)}`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <SaleReceiptCard sale={lastSale} />
            </Box>
          </Stack>
        </DataCard>
      )}
    </Stack>
  );
}

function LiveMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        borderRadius: 1.5,
        p: 1.2,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.35 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}
