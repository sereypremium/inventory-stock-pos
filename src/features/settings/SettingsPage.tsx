import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
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
import { useInventory } from '../../contexts/InventoryContext';
import type { ClearDatabaseTableKey } from '../../services/supabaseInventory';
import type { SystemSettingsInput } from '../../types/models';

interface FeedbackState {
  severity: AlertColor;
  message: string;
}

const clearableTables: Array<{
  key: ClearDatabaseTableKey;
  label: string;
  helper: string;
}> = [
  { key: 'sale_items', label: 'Sale items', helper: 'Line items inside sales' },
  { key: 'sale_headers', label: 'Sale headers', helper: 'Receipts and sale totals' },
  { key: 'purchase_items', label: 'Purchase items', helper: 'Line items inside stock in' },
  { key: 'purchase_headers', label: 'Purchase headers', helper: 'Stock in transactions' },
  { key: 'product_variants', label: 'Product variants', helper: 'Size, color, price, stock' },
  { key: 'products', label: 'Products', helper: 'Product catalog records' },
  { key: 'suppliers', label: 'Suppliers', helper: 'Supplier master data' },
  { key: 'categories', label: 'Categories', helper: 'Product category records' },
  { key: 'brands', label: 'Brands', helper: 'Product brand records' },
];

export function SettingsPage() {
  const { settings, saveSettings } = useAuth();
  const { clearDatabaseTables, dataSource } = useInventory();
  const [form, setForm] = useState<SystemSettingsInput>(settings);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedTables, setSelectedTables] = useState<ClearDatabaseTableKey[]>([]);
  const [clearConfirmed, setClearConfirmed] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  const toggleClearTable = (tableKey: ClearDatabaseTableKey) => {
    setSelectedTables((current) =>
      current.includes(tableKey)
        ? current.filter((selectedKey) => selectedKey !== tableKey)
        : [...current, tableKey],
    );
  };

  const handleClearTables = async () => {
    if (!clearConfirmed || selectedTables.length === 0) {
      setFeedback({
        severity: 'warning',
        message: 'Tick at least one table and confirm before clearing database data.',
      });
      return;
    }

    setIsClearing(true);
    const result = await clearDatabaseTables(selectedTables);
    setIsClearing(false);

    setFeedback({
      severity: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setSelectedTables([]);
      setClearConfirmed(false);
    }
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
        description="Clear selected database tables only after ticking exactly what should be removed."
        title="Database Maintenance"
      >
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Alert severity="warning">
            Clearing tables permanently removes those rows from the active {dataSource} data
            source. Pick only the tables you want to empty.
          </Alert>

          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {clearableTables.map((table) => (
              <Box
                key={table.key}
                sx={{
                  border: '1px solid',
                  borderColor: selectedTables.includes(table.key) ? 'error.main' : 'divider',
                  borderRadius: 1,
                  px: 1.25,
                  py: 0.75,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedTables.includes(table.key)}
                      color="error"
                      onChange={() => toggleClearTable(table.key)}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {table.label}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {table.helper}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', m: 0 }}
                />
              </Box>
            ))}
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={clearConfirmed}
                  color="error"
                  onChange={(event) => setClearConfirmed(event.target.checked)}
                />
              }
              label="I understand this will clear the selected database tables."
            />
          </FormGroup>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              color="error"
              disabled={isClearing || selectedTables.length === 0 || !clearConfirmed}
              onClick={() => {
                void handleClearTables();
              }}
              startIcon={<DeleteSweepOutlinedIcon />}
              variant="contained"
            >
              {isClearing ? 'Clearing...' : 'Clear Selected Tables'}
            </Button>
          </Box>
        </Stack>
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
