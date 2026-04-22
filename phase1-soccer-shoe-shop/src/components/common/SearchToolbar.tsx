import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { InputAdornment, Stack, TextField } from '@mui/material';
import type { ReactNode } from 'react';

interface SearchToolbarProps {
  value: string;
  on_change: (value: string) => void;
  placeholder: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function SearchToolbar({
  value,
  on_change,
  placeholder,
  filters,
  actions,
}: SearchToolbarProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.25}
      sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
        <TextField
          onChange={(event) => on_change(event.target.value)}
          placeholder={placeholder}
          size="small"
          sx={{ minWidth: { xs: '100%', md: 300 } }}
          value={value}
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
        {filters}
      </Stack>
      {actions}
    </Stack>
  );
}
