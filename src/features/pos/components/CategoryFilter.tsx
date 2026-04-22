import { Box, Chip, Stack, useMediaQuery, useTheme } from '@mui/material';

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ overflowX: 'auto', pb: 0.25 }}>
      <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content', pr: 1 }}>
        <Chip
          color={value === 'all' ? 'primary' : 'default'}
          label="All Categories"
          onClick={() => onChange('all')}
          size={isPhone ? 'medium' : 'small'}
          variant={value === 'all' ? 'filled' : 'outlined'}
        />
        {categories.map((category) => (
          <Chip
            color={value === category.id ? 'primary' : 'default'}
            key={category.id}
            label={category.name}
            onClick={() => onChange(category.id)}
            size={isPhone ? 'medium' : 'small'}
            variant={value === category.id ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
    </Box>
  );
}
