import { Chip } from '@mui/material';

interface StockChipProps {
  stockQty: number;
  minStock: number;
}

export function StockChip({ stockQty, minStock }: StockChipProps) {
  if (stockQty === 0) {
    return <Chip color="error" label="Out of stock" size="small" />;
  }

  if (stockQty <= minStock) {
    return <Chip color="warning" label="Low stock" size="small" />;
  }

  return <Chip color="success" label="Healthy" size="small" variant="outlined" />;
}
