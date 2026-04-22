import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Button, IconButton, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { AppTable } from '../common/AppTable';
import { DataCard } from '../common/DataCard';
import { FormActions } from '../common/FormActions';
import { TableEmptyState } from '../common/TableEmptyState';
import type { Product, ProductVariant, StockInInput, Supplier } from '../../types/models';
import { format_currency, format_number, to_date_input_value } from '../../utils/formatters';

interface StockInFormRow {
  id: string;
  product_id: string;
  product_variant_id: string;
  qty: number;
  cost_price: number;
}

interface StockInFormProps {
  suppliers: Supplier[];
  products: Product[];
  product_variants: ProductVariant[];
  created_by: string;
  currency?: string;
  on_cancel: () => void;
  on_submit: (input: StockInInput) => void;
}

function build_empty_row(): StockInFormRow {
  return {
    id: crypto.randomUUID(),
    product_id: '',
    product_variant_id: '',
    qty: 1,
    cost_price: 0,
  };
}

export function StockInForm({
  suppliers,
  products,
  product_variants,
  created_by,
  currency = 'USD',
  on_cancel,
  on_submit,
}: StockInFormProps) {
  const [supplier_id, setSupplierId] = useState('');
  const [purchase_date, setPurchaseDate] = useState(to_date_input_value(new Date()));
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<StockInFormRow[]>([build_empty_row()]);

  const variant_map = useMemo(
    () => Object.fromEntries(product_variants.map((variant) => [variant.id, variant])),
    [product_variants],
  );

  const total_qty = rows.reduce((total, row) => total + Number(row.qty || 0), 0);
  const total_amount = rows.reduce(
    (total, row) => total + Number(row.qty || 0) * Number(row.cost_price || 0),
    0,
  );

  return (
    <Stack
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        on_submit({
          supplier_id,
          purchase_date,
          notes,
          created_by,
          items: rows
            .filter((row) => row.product_variant_id)
            .map((row) => ({
              product_variant_id: row.product_variant_id,
              qty: Number(row.qty),
              cost_price: Number(row.cost_price),
            })),
        });
      }}
      spacing={3}
    >
      <DataCard description="Enter the supplier and receipt date before adding the item rows." title="Purchase Header">
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 3,
          }}
        >
          <TextField
            label="Supplier"
            onChange={(event) => setSupplierId(event.target.value)}
            required
            select
            value={supplier_id}
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Purchase date"
            onChange={(event) => setPurchaseDate(event.target.value)}
            required
            size="medium"
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            value={purchase_date}
          />
          <TextField label="Notes" onChange={(event) => setNotes(event.target.value)} value={notes} />
        </Box>
      </DataCard>

      <DataCard
        actions={
          <Button
            onClick={() => setRows((current) => [...current, build_empty_row()])}
            startIcon={<AddOutlinedIcon />}
            variant="outlined"
          >
            Add Row
          </Button>
        }
        description="Stock increases at the variant level. Select a product first, then choose the size and color variant."
        title="Purchase Items"
      >
        <AppTable
          head={
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Variant</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Cost Price</TableCell>
              <TableCell align="right">Line Total</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          }
          min_width={860}
        >
          {rows.length === 0 && <TableEmptyState colSpan={6} message="Add at least one item row." />}
          {rows.map((row) => {
            const row_variants = product_variants.filter(
              (variant) => variant.product_id === row.product_id,
            );
            const line_total = Number(row.qty || 0) * Number(row.cost_price || 0);

            return (
              <TableRow hover key={row.id}>
                <TableCell>
                  <TextField
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((entry) =>
                          entry.id === row.id
                            ? {
                                ...entry,
                                product_id: event.target.value,
                                product_variant_id: '',
                                cost_price: 0,
                              }
                            : entry,
                        ),
                      )
                    }
                    select
                    size="small"
                    sx={{ minWidth: 220 }}
                    value={row.product_id}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.model_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    disabled={!row.product_id}
                    onChange={(event) => {
                      const selected_variant = variant_map[event.target.value];

                      setRows((current) =>
                        current.map((entry) =>
                          entry.id === row.id
                            ? {
                                ...entry,
                                product_variant_id: event.target.value,
                                cost_price: selected_variant?.cost_price ?? entry.cost_price,
                              }
                            : entry,
                        ),
                      );
                    }}
                    select
                    size="small"
                    sx={{ minWidth: 220 }}
                    value={row.product_variant_id}
                  >
                    {row_variants.map((variant) => (
                      <MenuItem key={variant.id} value={variant.id}>
                        {variant.sku} - {variant.size} / {variant.color}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((entry) =>
                          entry.id === row.id
                            ? { ...entry, qty: Number(event.target.value) || 0 }
                            : entry,
                        ),
                      )
                    }
                    size="small"
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ width: 90 }}
                    type="number"
                    value={row.qty}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((entry) =>
                          entry.id === row.id
                            ? { ...entry, cost_price: Number(event.target.value) || 0 }
                            : entry,
                        ),
                      )
                    }
                    size="small"
                    slotProps={{ htmlInput: { min: 0 } }}
                    sx={{ width: 120 }}
                    type="number"
                    value={row.cost_price}
                  />
                </TableCell>
                <TableCell align="right">{format_currency(line_total, currency)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((current) => current.filter((entry) => entry.id !== row.id))
                    }
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </AppTable>
      </DataCard>

      <DataCard description="Purchase totals are calculated from the current item rows." title="Summary">
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 3,
          }}
        >
          <SummaryField label="Total Rows" value={format_number(rows.length)} />
          <SummaryField label="Total Qty" value={format_number(total_qty)} />
          <SummaryField label="Total Amount" value={format_currency(total_amount, currency)} />
        </Box>
      </DataCard>

      <FormActions on_cancel={on_cancel} submit_label="Save Stock In" />
    </Stack>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.75 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}
