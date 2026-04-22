import { Alert, Box, Drawer, Stack, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useMemo, useState } from 'react';
import { CartPanel, type PosCartItem } from '../../components/pos/CartPanel';
import { CheckoutPanel } from '../../components/pos/CheckoutPanel';
import { MobileCartSummary } from '../../components/pos/MobileCartSummary';
import { PosSearchResults } from '../../components/pos/PosSearchResults';
import { VariantSelectorDialog, type PosProductCardItem } from '../../components/pos/VariantSelectorDialog';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { load_catalog_state } from '../../services/catalogStore';
import { filter_pos_variants, get_sale_detail } from '../../services/salesService';
import type { PaymentMethod, ProductVariant } from '../../types/models';
import { open_print_window } from '../../utils/print';
import { build_receipt_html } from '../../utils/receipt';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

function build_product_cards(variants: ReturnType<typeof filter_pos_variants>) {
  const grouped = new Map<string, PosProductCardItem>();

  for (const variant of variants) {
    const existing = grouped.get(variant.product_id);

    if (existing) {
      existing.variants.push(variant);
      continue;
    }

    grouped.set(variant.product_id, {
      product_id: variant.product_id,
      product_code: variant.product_code,
      model_name: variant.model_name,
      brand_name: variant.brand_name,
      category_name: variant.category_name,
      variants: [variant],
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.model_name.localeCompare(right.model_name));
}

export function POSPage() {
  const theme = useTheme();
  const is_phone = useMediaQuery(theme.breakpoints.down('sm'));
  const is_tablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { session } = useAuth();
  const inventory = useInventory();
  const [search_query, setSearchQuery] = useState('');
  const [category_filter, setCategoryFilter] = useState('all');
  const [cart_items, setCartItems] = useState<PosCartItem[]>([]);
  const [customer_id, setCustomerId] = useState('');
  const [payment_method, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount_amount, setDiscountAmount] = useState(0);
  const [paid_amount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selected_product, setSelectedProduct] = useState<PosProductCardItem | null>(null);
  const [mobile_tab, setMobileTab] = useState(0);
  const [tablet_cart_open, setTabletCartOpen] = useState(false);

  const search_results = useMemo(
    () => filter_pos_variants(inventory, search_query, category_filter),
    [inventory, search_query, category_filter],
  );
  const product_cards = useMemo(() => build_product_cards(search_results), [search_results]);

  const subtotal = cart_items.reduce((total, item) => total + item.sale_price * item.qty, 0);
  const total_amount = Math.max(subtotal - discount_amount, 0);
  const change_amount = Math.max(paid_amount - total_amount, 0);
  const cart_count = cart_items.reduce((total, item) => total + item.qty, 0);

  const handle_add_variant_to_cart = (variant: ProductVariant | ReturnType<typeof filter_pos_variants>[number]) => {
    if (variant.stock_qty <= 0) {
      setFeedback({
        severity: 'error',
        message: `${variant.sku} is out of stock.`,
      });
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.product_variant_id === variant.id);

      if (existing) {
        if (existing.qty + 1 > existing.stock_qty) {
          setFeedback({
            severity: 'error',
            message: `Cannot sell above available stock for ${variant.sku}.`,
          });

          return current;
        }

        return current.map((item) =>
          item.product_variant_id === variant.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [
        {
          product_variant_id: variant.id,
          model_name: 'model_name' in variant ? variant.model_name : '',
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          sale_price: variant.sale_price,
          cost_price: variant.cost_price,
          stock_qty: variant.stock_qty,
          qty: 1,
        },
        ...current,
      ];
    });

    setSelectedProduct(null);
    if (is_phone) {
      setMobileTab(1);
    }
  };

  const handle_qty_change = (variant_id: string, qty: number) => {
    setCartItems((current) =>
      current.map((item) => {
        if (item.product_variant_id !== variant_id) {
          return item;
        }

        if (qty <= 0) {
          return item;
        }

        if (qty > item.stock_qty) {
          setFeedback({
            severity: 'error',
            message: `Cannot sell above available stock for ${item.sku}.`,
          });
          return item;
        }

        return { ...item, qty };
      }),
    );
  };

  const handle_checkout = () => {
    if (cart_items.length === 0) {
      setFeedback({
        severity: 'error',
        message: 'Cannot save sale with empty cart.',
      });
      return;
    }

    const result = inventory.create_sale({
      sale_date: new Date().toISOString(),
      customer_id: customer_id || null,
      discount_amount,
      paid_amount,
      payment_method,
      notes,
      created_by: session?.id ?? '',
      items: cart_items.map((item) => ({
        product_variant_id: item.product_variant_id,
        qty: item.qty,
        sale_price: item.sale_price,
        discount_amount: 0,
      })),
    });

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (!result.ok || !result.record_id) {
      return;
    }

    const latest_state = load_catalog_state();
    const detail = get_sale_detail(latest_state, result.record_id);

    if (detail) {
      open_print_window({
        title: detail.header.sale_no,
        body_html: build_receipt_html(detail, latest_state.settings),
      });
    }

    setCartItems([]);
    setCustomerId('');
    setPaymentMethod('cash');
    setDiscountAmount(0);
    setPaidAmount(0);
    setNotes('');
    setSearchQuery('');
    setCategoryFilter('all');
    setTabletCartOpen(false);
    if (is_phone) {
      setMobileTab(0);
    }
  };

  const products_panel = (
    <PosSearchResults
      categories={inventory.categories.filter((category) => category.status === 'active')}
      category_filter={category_filter}
      currency={inventory.settings.currency}
      on_category_change={setCategoryFilter}
      on_open_product={setSelectedProduct}
      on_search_change={setSearchQuery}
      products={product_cards}
      search_query={search_query}
    />
  );

  const cart_panel = (
    <CartPanel
      currency={inventory.settings.currency}
      items={cart_items}
      on_qty_change={handle_qty_change}
      on_remove={(variant_id) =>
        setCartItems((current) =>
          current.filter((item) => item.product_variant_id !== variant_id),
        )
      }
    />
  );

  const checkout_panel = (
    <CheckoutPanel
      cart_count={cart_count}
      change_amount={change_amount}
      customer_id={customer_id}
      currency={inventory.settings.currency}
      customers={inventory.customers.filter((customer) => customer.status === 'active')}
      discount_amount={discount_amount}
      is_checkout_disabled={cart_items.length === 0}
      notes={notes}
      on_checkout={handle_checkout}
      on_customer_change={setCustomerId}
      on_discount_change={setDiscountAmount}
      on_notes_change={setNotes}
      on_paid_amount_change={setPaidAmount}
      on_payment_method_change={setPaymentMethod}
      paid_amount={paid_amount}
      payment_method={payment_method}
      subtotal={subtotal}
      total_amount={total_amount}
    />
  );

  return (
    <Stack spacing={3} sx={{ pb: is_tablet ? 12 : 0 }}>
      <PageHeader
        description="Responsive cashier workflow with product browsing, touch-friendly variant picking, and fast cart plus checkout handling."
        title="Point Of Sale"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      {is_phone ? (
        <>
          <Tabs
            onChange={(_event, value) => setMobileTab(value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
            value={mobile_tab}
            variant="fullWidth"
          >
            <Tab label="Products" />
            <Tab label={`Cart (${cart_count})`} />
            <Tab label="Checkout" />
          </Tabs>

          {mobile_tab === 0 && products_panel}
          {mobile_tab === 1 && cart_panel}
          {mobile_tab === 2 && checkout_panel}

          <MobileCartSummary
            currency={inventory.settings.currency}
            item_count={cart_count}
            on_open_cart={() => setMobileTab(1)}
            on_open_checkout={() => setMobileTab(2)}
            total_amount={total_amount}
          />
        </>
      ) : is_tablet ? (
        <>
          <Stack spacing={2}>
            {products_panel}
          </Stack>

          <Drawer
            anchor="right"
            onClose={() => setTabletCartOpen(false)}
            open={tablet_cart_open}
            slotProps={{
              paper: {
                sx: {
                  p: 2,
                  width: { sm: 440, xs: '100%' },
                },
              },
            }}
          >
            <Stack spacing={2}>
              {cart_panel}
              {checkout_panel}
            </Stack>
          </Drawer>

          <MobileCartSummary
            currency={inventory.settings.currency}
            item_count={cart_count}
            on_open_cart={() => setTabletCartOpen(true)}
            on_open_checkout={() => setTabletCartOpen(true)}
            total_amount={total_amount}
          />
        </>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: '1.3fr 0.7fr',
            alignItems: 'start',
          }}
        >
          {products_panel}

          <Stack spacing={2} sx={{ position: 'sticky', top: 88 }}>
            {cart_panel}
            {checkout_panel}
          </Stack>
        </Box>
      )}

      <VariantSelectorDialog
        currency={inventory.settings.currency}
        on_add_variant={handle_add_variant_to_cart}
        on_close={() => setSelectedProduct(null)}
        open={Boolean(selected_product)}
        product={selected_product}
      />
    </Stack>
  );
}
