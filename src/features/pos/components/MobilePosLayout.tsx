import type { ReactNode } from 'react';
import { Stack, Tab, Tabs, Typography } from '@mui/material';
import { formatCurrency, formatNumber } from '../../../lib/formatters';

interface MobilePosLayoutProps {
  activeTab: number;
  itemCount: number;
  totalAmount: number;
  onTabChange: (value: number) => void;
  products: ReactNode;
  cart: ReactNode;
  checkout: ReactNode;
  actionBar: ReactNode;
}

export function MobilePosLayout({
  activeTab,
  itemCount,
  totalAmount,
  onTabChange,
  products,
  cart,
  checkout,
  actionBar,
}: MobilePosLayoutProps) {
  const tabLabel = (label: string, detail: string) => (
    <Stack spacing={0.2} sx={{ alignItems: 'center' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }} variant="inherit">
        {label}
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.1 }} variant="inherit">
        {detail}
      </Typography>
    </Stack>
  );

  return (
    <>
      <Tabs
        onChange={(_event, value) => onTabChange(value)}
        sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        value={activeTab}
        variant="fullWidth"
      >
        <Tab label={tabLabel('Products', 'Search & browse')} sx={{ minHeight: 68 }} />
        <Tab
          label={tabLabel('Cart', `${formatNumber(itemCount)} item(s)`)}
          sx={{ minHeight: 68 }}
        />
        <Tab
          label={tabLabel('Checkout', formatCurrency(totalAmount))}
          sx={{ minHeight: 68 }}
        />
      </Tabs>

      {activeTab === 0 && products}
      {activeTab === 1 && cart}
      {activeTab === 2 && checkout}

      {actionBar}
    </>
  );
}
