import { useMemo } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../contexts/InventoryContext';
import { DashboardKpiGrid } from './components/DashboardKpiGrid';
import { InventoryHealthSection } from './components/InventoryHealthSection';
import { OperationsSection } from './components/OperationsSection';
import { ProductPerformanceSection } from './components/ProductPerformanceSection';
import { ProfitSummaryCard } from './components/ProfitSummaryCard';
import { SalesTrendSection } from './components/SalesTrendSection';
import { buildDashboardAnalytics } from './dashboardUtils';

export function DashboardPage() {
  const { session, settings } = useAuth();
  const { brands, products, variants, sales, isDatabaseConnected, isSyncing } = useInventory();
  const analytics = useMemo(
    () =>
      buildDashboardAnalytics({
        brands,
        products,
        variants,
        sales,
      }),
    [brands, products, variants, sales],
  );
  const currentMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        action={
          <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/sales" variant="outlined">
              Sales History
            </Button>
            {session?.role === 'admin' && (
              <Button component={RouterLink} to="/reports" variant="outlined">
                Reports
              </Button>
            )}
            <Button component={RouterLink} to="/pos" variant="contained">
              Open POS
            </Button>
          </Stack>
        }
        description={`A manager-ready view of ${settings.storeName}${settings.branchName ? ` at ${settings.branchName}` : ''}, focused on today's sales pulse, product movement, inventory pressure, and cashier operations.`}
        title={`Welcome back, ${session?.name ?? 'team'}`}
      />

      {!isDatabaseConnected && !isSyncing && (
        <Alert severity="info">
          The dashboard is currently running from local mock and browser-stored data. Supabase
          becomes active automatically when the database connection is available.
        </Alert>
      )}

      {isSyncing && (
        <Alert severity="info">
          Connecting to Supabase and syncing the latest products, variants, and sales.
        </Alert>
      )}

      {analytics.usingFallbackSales && (
        <Alert severity="info">
          No completed sales have been recorded yet, so the dashboard is showing demo sales
          activity to keep the trend, operations, and business summary sections useful.
        </Alert>
      )}

      <DashboardKpiGrid analytics={analytics} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.15fr 1fr' },
          '& > *': { minWidth: 0 },
        }}
      >
        <SalesTrendSection analytics={analytics} />
        <ProductPerformanceSection analytics={analytics} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '1.15fr 0.95fr' },
          '& > *': { minWidth: 0 },
        }}
      >
        <InventoryHealthSection analytics={analytics} />
        <ProfitSummaryCard
          currentMonthLabel={currentMonthLabel}
          summary={analytics.businessSummary}
        />
      </Box>

      <OperationsSection analytics={analytics} />
    </Stack>
  );
}
