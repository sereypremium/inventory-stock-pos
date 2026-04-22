import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { IconButton, Stack, Typography } from '@mui/material';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  on_change: (value: number) => void;
}

export function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  on_change,
}: QuantityStepperProps) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <IconButton
        disabled={value <= min}
        onClick={() => on_change(Math.max(min, value - 1))}
        size="small"
        sx={{ border: '1px solid', borderColor: 'divider', height: 36, width: 36 }}
      >
        <RemoveOutlinedIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ minWidth: 24, textAlign: 'center' }} variant="body2">
        {value}
      </Typography>
      <IconButton
        disabled={value >= max}
        onClick={() => on_change(Math.min(max, value + 1))}
        size="small"
        sx={{ border: '1px solid', borderColor: 'divider', height: 36, width: 36 }}
      >
        <AddOutlinedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
