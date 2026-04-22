import { Alert, Stack } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { brands, categories, products, update_product } = useInventory();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const product = products.find((entry) => entry.id === id);

  if (!product) {
    return (
      <Stack spacing={3}>
        <PageHeader
          description="The requested product could not be found in the current local catalog."
          title="Edit Product"
        />
        <EmptyState
          description="The selected product may have been removed or the link is no longer valid."
          title="Product Not Found"
        />
      </Stack>
    );
  }

  const handle_submit = (values: ProductInput) => {
    const result = update_product(product.id, values);

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
        description="Update the core product information while keeping stock and pricing at the variant level."
        title={`Edit ${product.model_name}`}
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <DataCard
        description="Product code remains unique and the linked brand/category stay required."
        title="Product Form"
      >
        <Stack sx={{ p: 3 }}>
          <ProductForm
            brands={brands}
            categories={categories}
            initial_value={product}
            on_cancel={() => navigate(APP_ROUTES.products)}
            on_submit={handle_submit}
            submit_label="Save Changes"
          />
        </Stack>
      </DataCard>
    </Stack>
  );
}
