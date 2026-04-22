import { Alert, Stack } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StockInForm } from '../../components/stock/StockInForm';
import { APP_ROUTES } from '../../constants/routes';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import type { StockInInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function StockInCreatePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { suppliers, products, product_variants, settings, create_stock_in } = useInventory();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const active_suppliers = suppliers.filter((supplier) => supplier.status === 'active');
  const active_products = products.filter((product) => product.status === 'active');
  const active_variants = product_variants.filter((variant) => variant.status === 'active');

  const handle_submit = (input: StockInInput) => {
    const result = create_stock_in(input);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok && result.record_id) {
      navigate(APP_ROUTES.stock_in_detail(result.record_id));
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Create a purchase document to increase variant stock and capture the supplier receipt."
        title="New Stock In"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <StockInForm
        created_by={session?.id ?? ''}
        currency={settings.currency}
        on_cancel={() => navigate(APP_ROUTES.stock_in)}
        on_submit={handle_submit}
        product_variants={active_variants}
        products={active_products}
        suppliers={active_suppliers}
      />
    </Stack>
  );
}
