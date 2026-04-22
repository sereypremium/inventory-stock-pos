import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { DataCard } from '../../../components/common/DataCard';
import { formatNumber } from '../../../lib/formatters';
import type { PosProductGroup } from '../types';
import { CategoryFilter } from './CategoryFilter';
import { PosSearchBar } from './PosSearchBar';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: PosProductGroup[];
  categories: Array<{ id: string; name: string }>;
  searchQuery: string;
  categoryFilter: string;
  cartQuantityMap: Record<string, number>;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onResetFilters: () => void;
  onCategoryChange: (value: string) => void;
  onSelectProduct: (product: PosProductGroup) => void;
  onQuickAddVariant: (variantId: string) => void;
}

export function ProductGrid({
  products,
  categories,
  searchQuery,
  categoryFilter,
  cartQuantityMap,
  onSearchChange,
  onSearchSubmit,
  onResetFilters,
  onCategoryChange,
  onSelectProduct,
  onQuickAddVariant,
}: ProductGridProps) {
  const hasActiveFilters = searchQuery.trim().length > 0 || categoryFilter !== 'all';

  return (
    <DataCard
      actions={
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={`${formatNumber(products.length)} products`}
            size="small"
            variant="outlined"
          />
          <Chip label="Enter = quick add" size="small" variant="outlined" />
        </Stack>
      }
      description="Search active products fast, scan exact SKU or barcode with Enter, then pick the right size and color variant."
      title="Products"
    >
      <Stack
        spacing={1.5}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: { xs: 2, md: 3 },
          position: 'sticky',
          top: 72,
          zIndex: 2,
        }}
      >
        <PosSearchBar
          autoFocus
          onChange={onSearchChange}
          onClear={hasActiveFilters ? onResetFilters : undefined}
          onSubmit={onSearchSubmit}
          value={searchQuery}
        />
        <CategoryFilter
          categories={categories}
          onChange={onCategoryChange}
          value={categoryFilter}
        />
      </Stack>

      {products.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 700 }} variant="body1">
            No matching products
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            Try another keyword, scan an exact barcode, or change the current category filter.
          </Typography>
          {hasActiveFilters && (
            <Button onClick={onResetFilters} sx={{ mt: 2 }} variant="outlined">
              Clear search and filters
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
            p: { xs: 2, md: 3 },
          }}
        >
          {products.map((product) => {
            return (
              <ProductCard
                cartQuantityMap={cartQuantityMap}
                key={product.id}
                onQuickAddVariant={onQuickAddVariant}
                onSelectProduct={onSelectProduct}
                product={product}
              />
            );
          })}
        </Box>
      )}
    </DataCard>
  );
}
