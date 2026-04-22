import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Alert, Button, Stack } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { StockInForm } from './StockInForm';
import type { StockInInput } from '../../types/models';
import type { AlertColor } from '@mui/material';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function StockInCreatePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { suppliers, products, variants, createStockIn } = useInventory();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const canCreate = suppliers.length > 0 && variants.length > 0;

  const handleSubmit = (values: StockInInput) => {
    const result = createStockIn(values);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok && result.recordId) {
      navigate(`/stock-in/${result.recordId}`);
    }
  };

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
        description="Post a new receiving transaction. Stock is increased only after the receipt passes validation and is saved through the service layer."
        title="New Stock In"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      {!canCreate ? (
        <Alert severity="warning">
          Add at least one supplier and one product variant before posting stock in.
        </Alert>
      ) : (
        <StockInForm
          currentUserName={session?.name ?? 'Store Admin'}
          onSubmit={handleSubmit}
          products={products}
          suppliers={suppliers}
          variants={variants}
        />
      )}
    </Stack>
  );
}
