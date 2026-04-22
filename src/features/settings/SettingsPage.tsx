import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useEffect, useState } from 'react';
import { DataCard } from '../../components/common/DataCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import type { SystemSettingsInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

export function SettingsPage() {
  const { settings, saveSettings } = useAuth();
  const [form, setForm] = useState<SystemSettingsInput>(settings);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    const result = await saveSettings(form);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Button
            onClick={() => {
              void handleSave();
            }}
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
          >
            Save Settings
          </Button>
        }
        description="Control the store identity used across receipt printouts, report headers, and the main operational pages."
        title="Settings"
      />

      {feedback && (
        <Alert onClose={() => setFeedback(null)} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard
          helper="Main receipt and report brand"
          icon={<StorefrontOutlinedIcon fontSize="small" />}
          label="Store Name"
          value={form.storeName || '-'}
        />
        <StatCard
          accent="#2f6fcb"
          helper="Shown under the store name"
          icon={<ReceiptOutlinedIcon fontSize="small" />}
          label="Branch"
          value={form.branchName || '-'}
        />
        <StatCard
          accent="#2d7f4f"
          helper="Printed at the bottom of reports"
          icon={<SummarizeOutlinedIcon fontSize="small" />}
          label="Report Footer"
          value={form.reportFooter || '-'}
        />
      </Box>

      <DataCard
        description="Keep the setup practical. These values are stored in the active workspace data source and drive receipts, reports, and the dashboard identity."
        title="Store Profile"
      >
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            p: 3,
          }}
        >
          <TextField
            label="Store name"
            onChange={(event) =>
              setForm((current) => ({ ...current, storeName: event.target.value }))
            }
            required
            value={form.storeName}
          />
          <TextField
            label="Branch name"
            onChange={(event) =>
              setForm((current) => ({ ...current, branchName: event.target.value }))
            }
            required
            value={form.branchName}
          />
          <TextField
            label="Phone"
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            value={form.phone}
          />
          <TextField
            label="Address"
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            value={form.address}
          />
          <TextField
            label="Receipt footer"
            minRows={3}
            multiline
            onChange={(event) =>
              setForm((current) => ({ ...current, receiptFooter: event.target.value }))
            }
            sx={{ gridColumn: { md: '1 / -1' } }}
            value={form.receiptFooter}
          />
          <TextField
            label="Report footer"
            minRows={3}
            multiline
            onChange={(event) =>
              setForm((current) => ({ ...current, reportFooter: event.target.value }))
            }
            sx={{ gridColumn: { md: '1 / -1' } }}
            value={form.reportFooter}
          />
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              gridColumn: { md: '1 / -1' },
              justifyContent: 'flex-end',
            }}
          >
            <Button onClick={() => setForm(settings)} variant="outlined">
              Reset
            </Button>
            <Button startIcon={<SaveOutlinedIcon />} type="submit" variant="contained">
              Save Settings
            </Button>
          </Box>
        </Box>
      </DataCard>

      <DataCard
        description="This is the simple print identity that appears on receipts and reports."
        title="Print Preview"
      >
        <Stack spacing={1} sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 700 }} variant="h6">
            {form.storeName || 'Store name'}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {form.branchName || 'Branch name'}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {form.address || 'Address'}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {form.phone || 'Phone'}
          </Typography>
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 1,
              p: 2,
            }}
          >
            <Typography color="text.secondary" variant="caption">
              Receipt footer
            </Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              {form.receiptFooter || '-'}
            </Typography>
          </Box>
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography color="text.secondary" variant="caption">
              Report footer
            </Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              {form.reportFooter || '-'}
            </Typography>
          </Box>
        </Stack>
      </DataCard>
    </Stack>
  );
}
