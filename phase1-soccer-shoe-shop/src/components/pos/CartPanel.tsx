import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, IconButton, Stack, TableCell, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AppTable } from '../common/AppTable';
import { DataCard } from '../common/DataCard';
import { EmptyState } from '../common/EmptyState';
import { TableEmptyState } from '../common/TableEmptyState';
import { QuantityStepper } from './QuantityStepper';
import { format_currency, format_number } from '../../utils/formatters';

export interface PosCartItem {
  product_variant_id: string;
  model_name: string;
  sku: string;
  size: string;
  color: string;
  sale_price: number;
  cost_price: number;
  stock_qty: number;
  qty: number;
}

interface CartPanelProps {
  items: PosCartItem[];
  currency?: string;
  on_qty_change: (variant_id: string, qty: number) => void;
  on_remove: (variant_id: string) => void;
}

export function CartPanel({
  items,
  currency = 'USD',
  on_qty_change,
  on_remove,
}: CartPanelProps) {
  const theme = useTheme();
  const is_phone = useMediaQuery(theme.breakpoints.down('sm'));
  const subtotal = items.reduce((total, item) => total + item.qty * item.sale_price, 0);

  return (
    <DataCard
      description="Cart lines stay locked to each selected variant, and quantity cannot go above the available stock."
      title="Cart"
    >
      {items.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <EmptyState
            description="Add a product from the Products tab or product panel to begin the sale."
            title="Cart Is Empty"
          />
        </Box>
      ) : is_phone ? (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          {items.map((item) => (
            <Box
              key={item.product_variant_id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {item.model_name}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {item.sku} - {item.size} / {item.color}
                    </Typography>
                  </Box>
                  <IconButton color="error" onClick={() => on_remove(item.product_variant_id)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">
                      Stock
                    </Typography>
                    <Typography variant="body2">{format_number(item.stock_qty)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography color="text.secondary" variant="caption">
                      Amount
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {format_currency(item.qty * item.sale_price, currency)}
                    </Typography>
                  </Box>
                </Stack>

                <QuantityStepper
                  max={item.stock_qty}
                  on_change={(value) => on_qty_change(item.product_variant_id, value)}
                  value={item.qty}
                />
              </Stack>
            </Box>
          ))}

          <Stack direction="row" sx={{ justifyContent: 'space-between', pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              Cart subtotal
            </Typography>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {format_currency(subtotal, currency)}
            </Typography>
          </Stack>
        </Stack>
      ) : (
        <>
          <AppTable
            head={
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            }
            min_width={560}
          >
            {items.length === 0 && <TableEmptyState colSpan={5} message="Cart is empty." />}
            {items.map((item) => (
              <TableRow hover key={item.product_variant_id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {item.model_name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {item.sku} - {item.size} / {item.color}
                  </Typography>
                </TableCell>
                <TableCell align="right">{format_number(item.stock_qty)}</TableCell>
                <TableCell align="right">
                  <QuantityStepper
                    max={item.stock_qty}
                    on_change={(value) => on_qty_change(item.product_variant_id, value)}
                    value={item.qty}
                  />
                </TableCell>
                <TableCell align="right">
                  {format_currency(item.qty * item.sale_price, currency)}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => on_remove(item.product_variant_id)}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </AppTable>

          <Stack direction="row" sx={{ justifyContent: 'space-between', p: 3 }}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Cart Items
              </Typography>
              <Typography sx={{ fontWeight: 700 }} variant="body2">
                {format_number(items.reduce((total, item) => total + item.qty, 0))}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography color="text.secondary" variant="body2">
                Cart Subtotal
              </Typography>
              <Typography sx={{ fontWeight: 700 }} variant="body2">
                {format_currency(subtotal, currency)}
              </Typography>
            </Box>
          </Stack>
        </>
      )}
    </DataCard>
  );
}
