import { Alert, Stack } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataCard } from '../../components/common/DataCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { ProductForm } from '../../components/products/ProductForm';
import { APP_ROUTES } from '../../constants/routes';
import { useInventory } from '../../contexts/InventoryContext';
import type { ProductInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { brands, categories, add_product } = useInventory();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  if (brands.length === 0 || categories.length === 0) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="Products depend on brands and categories, so set up those master records first."
          title="New Product"
        />
        <EmptyState
          description="Create at least one brand and one category before adding a product."
          title="Master Data Required"
        />
      </Stack>
    );
  }

  const handle_submit = (values: ProductInput) => {
    const result = add_product(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      navigate(APP_ROUTES.products);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Create a new shoe model and keep the detailed stock rows inside the product variant page."
        title="New Product"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <DataCard
        description="Fill in the core product information. Product code must stay unique."
        title="Product Form"
      >
        <Stack sx={{ p: 3 }}>
          <ProductForm
            brands={brands}
            categories={categories}
            on_cancel={() => navigate(APP_ROUTES.products)}
            on_submit={handle_submit}
            submit_label="Save Product"
          />
        </Stack>
      </DataCard>
    </Stack>
  );
}
