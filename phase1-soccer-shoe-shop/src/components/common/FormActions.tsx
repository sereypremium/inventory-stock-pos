import { Box, Button } from '@mui/material';

interface FormActionsProps {
  on_cancel: () => void;
  submit_label: string;
  is_submitting?: boolean;
}

export function FormActions({
  on_cancel,
  submit_label,
  is_submitting = false,
}: FormActionsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        justifyContent: 'flex-end',
        mt: 3,
      }}
    >
      <Button onClick={on_cancel} variant="outlined">
        Cancel
      </Button>
      <Button disabled={is_submitting} type="submit" variant="contained">
        {submit_label}
      </Button>
    </Box>
  );
}
