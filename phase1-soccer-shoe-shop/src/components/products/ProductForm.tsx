import { Box, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormActions } from '../common/FormActions';
import type { Brand, Category, Gender, Product, ProductInput } from '../../types/models';

interface ProductFormProps {
  brands: Brand[];
  categories: Category[];
  initial_value?: Product | null;
  submit_label: string;
  on_cancel: () => void;
  on_submit: (values: ProductInput) => void;
}

const default_product_form: ProductInput = {
  product_code: '',
  brand_id: '',
  category_id: '',
  model_name: '',
  gender: 'unisex',
  description: '',
  image_url: '',
  status: 'active',
};

const gender_options: Array<{ label: string; value: Gender }> = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
  { label: 'Kids', value: 'kids' },
];

export function ProductForm({
  brands,
  categories,
  initial_value,
  submit_label,
  on_cancel,
  on_submit,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductInput>(default_product_form);

  useEffect(() => {
    if (initial_value) {
      setForm({
        product_code: initial_value.product_code,
        brand_id: initial_value.brand_id,
        category_id: initial_value.category_id,
        model_name: initial_value.model_name,
        gender: initial_value.gender,
        description: initial_value.description,
        image_url: initial_value.image_url,
        status: initial_value.status,
      });
      return;
    }

    setForm({
      ...default_product_form,
      brand_id: brands[0]?.id ?? '',
      category_id: categories[0]?.id ?? '',
    });
  }, [brands, categories, initial_value]);

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        on_submit(form);
      }}
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      }}
    >
      <TextField
        label="Product code"
        onChange={(event) =>
          setForm((current) => ({ ...current, product_code: event.target.value }))
        }
        required
        value={form.product_code}
      />
      <TextField
        label="Model name"
        onChange={(event) =>
          setForm((current) => ({ ...current, model_name: event.target.value }))
        }
        required
        value={form.model_name}
      />
      <TextField
        label="Brand"
        onChange={(event) => setForm((current) => ({ ...current, brand_id: event.target.value }))}
        required
        select
        value={form.brand_id}
      >
        {brands.map((brand) => (
          <MenuItem key={brand.id} value={brand.id}>
            {brand.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Category"
        onChange={(event) =>
          setForm((current) => ({ ...current, category_id: event.target.value }))
        }
        required
        select
        value={form.category_id}
      >
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Gender"
        onChange={(event) =>
          setForm((current) => ({ ...current, gender: event.target.value as Gender }))
        }
        required
        select
        value={form.gender}
      >
        {gender_options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Image URL"
        onChange={(event) =>
          setForm((current) => ({ ...current, image_url: event.target.value }))
        }
        value={form.image_url}
      />
      <TextField
        label="Status"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            status: event.target.value as ProductInput['status'],
          }))
        }
        required
        select
        value={form.status}
      >
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </TextField>
      <Box />
      <TextField
        label="Description"
        minRows={4}
        multiline
        onChange={(event) =>
          setForm((current) => ({ ...current, description: event.target.value }))
        }
        sx={{ gridColumn: { md: '1 / -1' } }}
        value={form.description}
      />

      <Box sx={{ gridColumn: { md: '1 / -1' } }}>
        <FormActions on_cancel={on_cancel} submit_label={submit_label} />
      </Box>
    </Box>
  );
}
