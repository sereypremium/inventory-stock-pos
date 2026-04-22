import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Box, Chip, InputAdornment, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DataCard } from '../common/DataCard';
import { EmptyState } from '../common/EmptyState';
import type { PosProductCardItem } from './VariantSelectorDialog';
import { format_currency, format_number } from '../../utils/formatters';

interface CategoryFilterOption {
  id: string;
  name: string;
}

interface PosSearchResultsProps {
  search_query: string;
  category_filter: string;
  categories: CategoryFilterOption[];
  products: PosProductCardItem[];
  currency?: string;
  on_search_change: (value: string) => void;
  on_category_change: (value: string) => void;
  on_open_product: (product: PosProductCardItem) => void;
}

export function PosSearchResults({
  search_query,
  category_filter,
  categories,
  products,
  currency = 'USD',
  on_search_change,
  on_category_change,
  on_open_product,
}: PosSearchResultsProps) {
  const theme = useTheme();
  const is_phone = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <DataCard
      description="Search fast, tap a product card, then choose the size and color variant from the selector."
      title="Products"
    >
      <Stack
        spacing={1.5}
        sx={{
          backgroundColor: 'background.paper',
          position: 'sticky',
          top: { xs: 72, md: 88 },
          zIndex: 3,
          px: 3,
          py: 2,
        }}
      >
        <TextField
          onChange={(event) => on_search_change(event.target.value)}
          placeholder="Search by model, SKU, or barcode"
          size={is_phone ? 'medium' : 'small'}
          value={search_query}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            color={category_filter === 'all' ? 'primary' : 'default'}
            label="All"
            onClick={() => on_category_change('all')}
            size={is_phone ? 'medium' : 'small'}
            variant={category_filter === 'all' ? 'filled' : 'outlined'}
          />
          {categories.map((category) => (
            <Chip
              color={category_filter === category.id ? 'primary' : 'default'}
              key={category.id}
              label={category.name}
              onClick={() => on_category_change(category.id)}
              size={is_phone ? 'medium' : 'small'}
              variant={category_filter === category.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Stack>

      {products.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <EmptyState
            description="Try a different keyword or change the category chip to see more products."
            title="No Matching Products"
          />
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
            p: 3,
          }}
        >
          {products.map((product) => {
            const total_stock = product.variants.reduce((total, variant) => total + variant.stock_qty, 0);
            const starting_price = Math.min(...product.variants.map((variant) => variant.sale_price));
            const available_count = product.variants.filter((variant) => variant.stock_qty > 0).length;

            return (
              <Box
                key={product.product_id}
                onClick={() => on_open_product(product)}
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  minHeight: is_phone ? 180 : 168,
                  p: is_phone ? 2.25 : 2,
                  transition: 'border-color 120ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Stack spacing={1.25} sx={{ height: '100%', justifyContent: 'space-between' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} variant="body1">
                          {product.model_name}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {product.product_code} - {product.brand_name}
                        </Typography>
                      </Box>
                      <Chip
                        color={available_count > 0 ? 'success' : 'default'}
                        label={available_count > 0 ? `${format_number(available_count)} variants` : 'No stock'}
                        size={is_phone ? 'medium' : 'small'}
                        variant={available_count > 0 ? 'filled' : 'outlined'}
                      />
                    </Stack>

                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      <Chip
                        icon={<Inventory2OutlinedIcon fontSize="small" />}
                        label={product.category_name}
                        size={is_phone ? 'medium' : 'small'}
                        variant="outlined"
                      />
                      {product.variants.slice(0, 3).map((variant) => (
                        <Chip
                          key={variant.id}
                          label={`${variant.size} / ${variant.color}`}
                          size={is_phone ? 'medium' : 'small'}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Total stock
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {format_number(total_stock)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography color="text.secondary" variant="caption">
                        Starting price
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {format_currency(starting_price, currency)}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </DataCard>
  );
}
