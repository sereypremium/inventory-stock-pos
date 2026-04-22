import { Chip } from '@mui/material';

interface StockChipProps {
  stock_qty: number;
  min_stock_qty: number;
}

export function StockChip({ stock_qty, min_stock_qty }: StockChipProps) {
  if (stock_qty === 0) {
    return <Chip color="error" label="Out of stock" size="small" />;
  }

  if (stock_qty <= min_stock_qty) {
    return <Chip color="warning" label="Low stock" size="small" />;
  }

  return <Chip color="success" label="Healthy" size="small" variant="outlined" />;
}
