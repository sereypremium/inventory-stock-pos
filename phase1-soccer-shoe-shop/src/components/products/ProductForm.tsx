import { Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormActions } from '../common/FormActions';
import type { Brand, Category, Gender, Product, ProductInput } from '../../types/models';
import { create_uploaded_image_data_url } from '../../utils/imageUpload';

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
  const [image_load_error, set_image_load_error] = useState(false);
  const [image_upload_error, set_image_upload_error] = useState('');
  const [is_uploading_image, set_is_uploading_image] = useState(false);

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

  useEffect(() => {
    set_image_load_error(false);
  }, [form.image_url]);

  const handle_image_upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    set_is_uploading_image(true);
    set_image_upload_error('');

    try {
      const next_image_url = await create_uploaded_image_data_url(file);

      setForm((current) => ({ ...current, image_url: next_image_url }));
      set_image_load_error(false);
    } catch (error) {
      set_image_upload_error(
        error instanceof Error ? error.message : 'The photo could not be uploaded.',
      );
    } finally {
      set_is_uploading_image(false);
    }
  };

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
      <Box sx={{ gridColumn: { md: '1 / -1' } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              Product Photo
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4 }} variant="caption">
              Upload a JPG, PNG, or WebP photo. The image is resized automatically before saving.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button component="label" disabled={is_uploading_image} variant="outlined">
              {form.image_url ? 'Replace Photo' : 'Upload Photo'}
              <input
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handle_image_upload}
                type="file"
              />
            </Button>
            <Button
              color="inherit"
              disabled={!form.image_url || is_uploading_image}
              onClick={() => {
                setForm((current) => ({ ...current, image_url: '' }));
                set_image_load_error(false);
                set_image_upload_error('');
              }}
              variant="text"
            >
              Remove
            </Button>
          </Stack>
        </Stack>
        {(is_uploading_image || image_upload_error) && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.25 }}>
            {is_uploading_image && <CircularProgress size={16} thickness={5} />}
            <Typography
              color={image_upload_error ? 'error.main' : 'text.secondary'}
              variant="caption"
            >
              {image_upload_error || 'Processing photo...'}
            </Typography>
          </Stack>
        )}
      </Box>
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
      {form.image_url.trim() && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: image_load_error ? 'error.main' : 'divider',
            borderRadius: 2,
            gridColumn: { md: '1 / -1' },
            p: 2.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center' }} variant="body2">
            Image Preview
          </Typography>
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(15, 91, 79, 0.04)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              height: 168,
              justifyContent: 'center',
              marginInline: 'auto',
              maxWidth: 168,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {image_load_error ? (
              <Typography color="error.main" sx={{ px: 2, textAlign: 'center' }} variant="body2">
                Unable to load image preview.
              </Typography>
            ) : (
              <Box
                alt={form.model_name || 'Product preview'}
                component="img"
                onError={() => set_image_load_error(true)}
                src={form.image_url}
                sx={{
                  display: 'block',
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
              />
            )}
          </Box>
        </Box>
      )}
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
