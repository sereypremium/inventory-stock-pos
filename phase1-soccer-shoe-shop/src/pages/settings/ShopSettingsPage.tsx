import { Alert, Box, Stack, TextField } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useState } from 'react';
import { DataCard } from '../../components/common/DataCard';
import { FormActions } from '../../components/common/FormActions';
import { PageHeader } from '../../components/common/PageHeader';
import { useInventory } from '../../contexts/InventoryContext';
import type { ShopSettingsInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function ShopSettingsPage() {
  const { settings, update_settings } = useInventory();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [form, setForm] = useState<ShopSettingsInput>({
    shop_name: settings.shop_name,
    shop_logo_url: settings.shop_logo_url,
    phone: settings.phone,
    address: settings.address,
    currency: settings.currency,
    receipt_footer: settings.receipt_footer,
    theme_color: settings.theme_color,
  });

  const handle_submit = () => {
    const result = update_settings(form);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        description="Maintain the core shop identity used by receipts and printed reports."
        title="Shop Settings"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <DataCard description="These values are stored locally in mock mode and can later map directly to the backend settings table." title="Shop Profile">
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            handle_submit();
          }}
          sx={{ p: 3 }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            <TextField
              label="Shop name"
              onChange={(event) => setForm((current) => ({ ...current, shop_name: event.target.value }))}
              required
              value={form.shop_name}
            />
            <TextField
              label="Phone"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              value={form.phone}
            />
            <TextField
              label="Currency"
              onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
              value={form.currency}
            />
            <TextField
              label="Theme color"
              onChange={(event) =>
                setForm((current) => ({ ...current, theme_color: event.target.value }))
              }
              value={form.theme_color}
            />
            <TextField
              label="Shop logo URL"
              onChange={(event) =>
                setForm((current) => ({ ...current, shop_logo_url: event.target.value }))
              }
              sx={{ gridColumn: { md: '1 / span 2' } }}
              value={form.shop_logo_url}
            />
            <TextField
              label="Address"
              minRows={2}
              multiline
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              sx={{ gridColumn: { md: '1 / span 2' } }}
              value={form.address}
            />
            <TextField
              label="Receipt footer"
              minRows={3}
              multiline
              onChange={(event) =>
                setForm((current) => ({ ...current, receipt_footer: event.target.value }))
              }
              sx={{ gridColumn: { md: '1 / span 2' } }}
              value={form.receipt_footer}
            />
          </Box>

          <FormActions on_cancel={() => setForm({
            shop_name: settings.shop_name,
            shop_logo_url: settings.shop_logo_url,
            phone: settings.phone,
            address: settings.address,
            currency: settings.currency,
            receipt_footer: settings.receipt_footer,
            theme_color: settings.theme_color,
          })} submit_label="Save Settings" />
        </Box>
      </DataCard>
    </Stack>
  );
}
