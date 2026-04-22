import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../../lib/formatters';
import { printSaleReceipt } from '../../../services/receiptPrint';
import type { SaleRecord } from '../../../types/models';
import { SaleReceiptCard } from '../../sales/SaleReceiptCard';

interface ReceiptPreviewDialogProps {
  open: boolean;
  sale: SaleRecord | null;
  onClose: () => void;
}

export function ReceiptPreviewDialog({
  open,
  sale,
  onClose,
}: ReceiptPreviewDialogProps) {
  const { settings } = useAuth();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  if (!sale) {
    return null;
  }

  return (
    <Dialog
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Receipt Preview
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1 }}>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 91, 79, 0.05)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Box sx={{ fontWeight: 700 }}>{sale.receiptNo}</Box>
                <Box sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {formatDateTime(sale.soldAt)} | Cashier {sale.cashierName}
                </Box>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`${formatNumber(sale.totalQuantity)} units`} size="small" />
                <Chip label={formatCurrency(sale.totalAmount)} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Box>

          <Stack sx={{ alignItems: 'center' }}>
            <SaleReceiptCard sale={sale} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 3 }}>
        <Button
          component={RouterLink}
          startIcon={<VisibilityOutlinedIcon />}
          to={`/sales/${sale.id}`}
          variant="outlined"
        >
          View Sale
        </Button>
        <Button
          onClick={() => printSaleReceipt(sale, settings)}
          startIcon={<PrintOutlinedIcon />}
          variant="contained"
        >
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
