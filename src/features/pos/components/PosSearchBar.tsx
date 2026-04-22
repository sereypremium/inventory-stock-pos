import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { IconButton, InputAdornment, TextField, useMediaQuery, useTheme } from '@mui/material';

interface PosSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export function PosSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  autoFocus = false,
}: PosSearchBarProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <TextField
      autoFocus={autoFocus}
      fullWidth
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onSubmit?.();
        }
      }}
      placeholder="Search by model, SKU, or barcode"
      size={isPhone ? 'medium' : 'small'}
      value={value}
      slotProps={{
        input: {
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton edge="end" onClick={() => onClear?.()} size="small">
                <CloseOutlinedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
