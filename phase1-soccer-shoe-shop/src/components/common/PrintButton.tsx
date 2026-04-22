import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { Button } from '@mui/material';

interface PrintButtonProps {
  label?: string;
  on_print?: () => void;
  variant?: 'contained' | 'outlined' | 'text';
}

export function PrintButton({
  label = 'Print',
  on_print,
  variant = 'outlined',
}: PrintButtonProps) {
  return (
    <Button onClick={() => (on_print ? on_print() : window.print())} startIcon={<PrintOutlinedIcon />} variant={variant}>
      {label}
    </Button>
  );
}
