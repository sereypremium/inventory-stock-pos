import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DataCard } from '../../components/common/DataCard';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import type {
  Product,
  ProductVariant,
  StockInInput,
  Supplier,
} from '../../types/models';

interface StockInFormRow {
  rowId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
}

interface StockInFormErrors {
  supplierId?: string;
  referenceNo?: string;
  receivedDate?: string;
  receivedBy?: string;
  items?: string;
  rows: Array<{
    variantId?: string;
    quantity?: string;
    unitCost?: string;
  }>;
}

interface StockInFormProps {
  suppliers: Supplier[];
  products: Product[];
  variants: ProductVariant[];
  currentUserName: string;
  onSubmit: (values: StockInInput) => void;
}

function createEmptyRow(): StockInFormRow {
  return {
    rowId: crypto.randomUUID(),
    variantId: '',
    quantity: 1,
    unitCost: 0,
  };
}

function getTodayValue() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function buildDefaultForm(currentUserName: string, suppliers: Supplier[]) {
  return {
    supplierId: suppliers[0]?.id ?? '',
    referenceNo: '',
    receivedDate: getTodayValue(),
    receivedBy: currentUserName,
    note: '',
  };
}

function validateForm(
  header: Omit<StockInInput, 'items'>,
  rows: StockInFormRow[],
): StockInFormErrors {
  const errors: StockInFormErrors = {
    rows: rows.map(() => ({})),
  };

  if (!header.supplierId.trim()) {
    errors.supplierId = 'Select a supplier.';
  }

  if (!header.referenceNo.trim()) {
    errors.referenceNo = 'Reference number is required.';
  }

  if (!header.receivedDate.trim()) {
    errors.receivedDate = 'Received date is required.';
  }

  if (!header.receivedBy.trim()) {
    errors.receivedBy = 'Received by is required.';
  }

  if (rows.length === 0) {
    errors.items = 'Add at least one item row.';
    return errors;
  }

  const selectedVariants = new Map<string, number[]>();

  rows.forEach((row, index) => {
    if (!row.variantId.trim()) {
      errors.rows[index].variantId = 'Select a variant.';
    } else {
      selectedVariants.set(row.variantId, [...(selectedVariants.get(row.variantId) ?? []), index]);
    }

    if (!Number.isInteger(row.quantity) || row.quantity <= 0) {
      errors.rows[index].quantity = 'Use a whole number above zero.';
    }

    if (!Number.isFinite(row.unitCost) || row.unitCost <= 0) {
      errors.rows[index].unitCost = 'Cost must be greater than zero.';
    }
  });

  for (const indexes of selectedVariants.values()) {
    if (indexes.length > 1) {
      indexes.forEach((index) => {
        errors.rows[index].variantId = 'This variant is already selected in another row.';
      });
    }
  }

  return errors;
}

function hasErrors(errors: StockInFormErrors) {
  if (errors.supplierId || errors.referenceNo || errors.receivedDate || errors.receivedBy || errors.items) {
    return true;
  }

  return errors.rows.some((row) => row.variantId || row.quantity || row.unitCost);
}

export function StockInForm({
  suppliers,
  products,
  variants,
  currentUserName,
  onSubmit,
}: StockInFormProps) {
  const [header, setHeader] = useState<Omit<StockInInput, 'items'>>(() =>
    buildDefaultForm(currentUserName, suppliers),
  );
  const [rows, setRows] = useState<StockInFormRow[]>([createEmptyRow()]);
  const [errors, setErrors] = useState<StockInFormErrors>({ rows: [{}] });

  useEffect(() => {
    setHeader((current) => ({
      ...current,
      supplierId: current.supplierId || suppliers[0]?.id || '',
      receivedBy: current.receivedBy || currentUserName,
    }));
  }, [currentUserName, suppliers]);

  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
  const visibleSuppliers = suppliers.filter((supplier) => supplier.status === 'active');
  const supplierOptions = visibleSuppliers.length > 0 ? visibleSuppliers : suppliers;
  const variantOptions = variants
    .filter((variant) => productMap[variant.productId])
    .sort((left, right) => {
      const leftName = productMap[left.productId]?.name ?? '';
      const rightName = productMap[right.productId]?.name ?? '';

      return leftName.localeCompare(rightName) || left.size.localeCompare(right.size);
    });
  const selectedVariantIds = rows.map((row) => row.variantId).filter(Boolean);
  const totalQuantity = rows.reduce((total, row) => total + (Number.isFinite(row.quantity) ? row.quantity : 0), 0);
  const totalCost = rows.reduce(
    (total, row) => total + (Number.isFinite(row.quantity) && Number.isFinite(row.unitCost) ? row.quantity * row.unitCost : 0),
    0,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(header, rows);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    onSubmit({
      ...header,
      items: rows.map((row) => ({
        variantId: row.variantId,
        quantity: row.quantity,
        unitCost: row.unitCost,
      })),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <DataCard
          description="Capture the receipt header once, then add the exact variants and quantities that arrived."
          title="Stock In Header"
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              p: 3,
            }}
          >
            <TextField
              error={Boolean(errors.supplierId)}
              helperText={errors.supplierId}
              label="Supplier"
              onChange={(event) =>
                setHeader((current) => ({ ...current, supplierId: event.target.value }))
              }
              required
              select
              value={header.supplierId}
            >
              {supplierOptions.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              error={Boolean(errors.referenceNo)}
              helperText={errors.referenceNo}
              label="Reference number"
              onChange={(event) =>
                setHeader((current) => ({ ...current, referenceNo: event.target.value }))
              }
              required
              value={header.referenceNo}
            />
            <TextField
              error={Boolean(errors.receivedDate)}
              helperText={errors.receivedDate}
              label="Received date"
              onChange={(event) =>
                setHeader((current) => ({ ...current, receivedDate: event.target.value }))
              }
              required
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={header.receivedDate}
            />
            <TextField
              error={Boolean(errors.receivedBy)}
              helperText={errors.receivedBy}
              label="Received by"
              onChange={(event) =>
                setHeader((current) => ({ ...current, receivedBy: event.target.value }))
              }
              required
              value={header.receivedBy}
            />
            <TextField
              label="Note"
              minRows={3}
              multiline
              onChange={(event) => setHeader((current) => ({ ...current, note: event.target.value }))}
              sx={{ gridColumn: { md: '1 / -1' } }}
              value={header.note}
            />
          </Box>
        </DataCard>

        <DataCard
          actions={
            <Button
              onClick={() => {
                setRows((current) => [...current, createEmptyRow()]);
                setErrors((current) => ({
                  ...current,
                  items: undefined,
                  rows: [...current.rows, {}],
                }));
              }}
              startIcon={<AddOutlinedIcon />}
              variant="outlined"
            >
              Add Item Row
            </Button>
          }
          description="Each row posts stock to a specific size and color variant."
          title="Received Items"
        >
          <Stack spacing={2} sx={{ p: 3 }}>
            {errors.items && (
              <Typography color="error.main" variant="body2">
                {errors.items}
              </Typography>
            )}

            {rows.map((row, index) => {
              const variant = variants.find((entry) => entry.id === row.variantId);
              const product = variant ? productMap[variant.productId] : null;

              return (
                <Box
                  key={row.rowId}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '2.2fr 0.8fr 0.9fr auto' },
                    }}
                  >
                    <TextField
                      error={Boolean(errors.rows[index]?.variantId)}
                      helperText={errors.rows[index]?.variantId}
                      label={`Variant ${index + 1}`}
                      onChange={(event) => {
                        const selectedVariant = variants.find(
                          (entry) => entry.id === event.target.value,
                        );

                        setRows((current) =>
                          current.map((entry) =>
                            entry.rowId === row.rowId
                              ? {
                                  ...entry,
                                  variantId: event.target.value,
                                  unitCost: selectedVariant?.costPrice ?? entry.unitCost,
                                }
                              : entry,
                          ),
                        );
                      }}
                      required
                      select
                      value={row.variantId}
                    >
                      {variantOptions.map((option) => {
                        const productName = productMap[option.productId]?.name ?? 'Unknown product';
                        const disabled =
                          selectedVariantIds.includes(option.id) && option.id !== row.variantId;

                        return (
                          <MenuItem disabled={disabled} key={option.id} value={option.id}>
                            {productName} | {option.size} / {option.color} | {option.sku}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                    <TextField
                      error={Boolean(errors.rows[index]?.quantity)}
                      helperText={errors.rows[index]?.quantity}
                      label="Quantity"
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((entry) =>
                            entry.rowId === row.rowId
                              ? { ...entry, quantity: Number(event.target.value) }
                              : entry,
                          ),
                        )
                      }
                      required
                      type="number"
                      value={row.quantity}
                    />
                    <TextField
                      error={Boolean(errors.rows[index]?.unitCost)}
                      helperText={errors.rows[index]?.unitCost}
                      label="Unit cost"
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((entry) =>
                            entry.rowId === row.rowId
                              ? { ...entry, unitCost: Number(event.target.value) }
                              : entry,
                          ),
                        )
                      }
                      required
                      type="number"
                      value={row.unitCost}
                    />
                    <Box
                      sx={{
                        alignItems: 'flex-start',
                        display: 'flex',
                        justifyContent: { xs: 'flex-start', md: 'center' },
                        pt: { md: 1 },
                      }}
                    >
                      <IconButton
                        color="error"
                        disabled={rows.length === 1}
                        onClick={() => {
                          setRows((current) => current.filter((entry) => entry.rowId !== row.rowId));
                          setErrors((current) => ({
                            ...current,
                            rows: current.rows.filter((_, rowIndex) => rowIndex !== index),
                          }));
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    sx={{ justifyContent: 'space-between', mt: 1.5 }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      {product && variant
                        ? `${product.name} | SKU ${variant.sku} | Current stock ${formatNumber(variant.stockQty)}`
                        : 'Select a variant to review the current stock level.'}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      Line total: {formatCurrency((row.quantity || 0) * (row.unitCost || 0))}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </DataCard>

        <DataCard
          description="Quick totals before posting the receipt."
          title="Transaction Summary"
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              p: 3,
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="body2">
                Item rows
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.5 }} variant="h6">
                {formatNumber(rows.length)}
              </Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Total quantity
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.5 }} variant="h6">
                {formatNumber(totalQuantity)}
              </Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Total cost
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 0.5 }} variant="h6">
                {formatCurrency(totalCost)}
              </Typography>
            </Box>
            <Box sx={{ alignItems: { md: 'flex-end' }, display: 'flex' }}>
              <Button size="large" type="submit" variant="contained">
                Post Stock In
              </Button>
            </Box>
          </Box>
        </DataCard>
      </Stack>
    </Box>
  );
}
