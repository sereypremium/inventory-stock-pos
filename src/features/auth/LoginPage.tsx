import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLogo } from '../../components/app/AppLogo';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authError, authStatus, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath =
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setError(null);
      navigate(nextPath, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        minHeight: '100vh',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', lg: '1.05fr 0.95fr' },
          }}
        >
          <Paper
            sx={{
              background:
                'linear-gradient(145deg, rgba(15, 91, 79, 0.96), rgba(8, 46, 40, 0.96))',
              border: 'none',
              color: 'common.white',
              overflow: 'hidden',
              p: { xs: 3, md: 4 },
              position: 'relative',
            }}
          >
            <Box
              sx={{
                background:
                  'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 35%)',
                inset: 0,
                pointerEvents: 'none',
                position: 'absolute',
              }}
            />
            <Stack spacing={4} sx={{ position: 'relative' }}>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <AppLogo />
                <Stack direction="row" spacing={1}>
                  <Chip
                    label="Phase 1"
                    size="small"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'common.white' }}
                  />
                  <Chip
                    label={isSupabaseConfigured ? 'Supabase Auth' : 'Auth setup required'}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255,255,255,0.16)', color: 'common.white' }}
                  />
                </Stack>
              </Stack>

              <Box>
                <Typography sx={{ maxWidth: 560 }} variant="h3">
                  Fast, clean inventory control for a real football boot shop.
                </Typography>
                <Typography
                  sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 560, mt: 2 }}
                  variant="body1"
                >
                  Sign in with your Supabase Auth email and password. Your workspace role is loaded
                  from the profiles table before the POS opens.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                }}
              >
                <Card sx={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none' }}>
                  <CardContent>
                    <BoltOutlinedIcon sx={{ color: 'common.white' }} />
                    <Typography color="common.white" sx={{ mt: 2 }} variant="h6">
                      Fast setup
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)' }} variant="body2">
                      Catalog pages are organized for quick daily admin work.
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none' }}>
                  <CardContent>
                    <SportsSoccerOutlinedIcon sx={{ color: 'common.white' }} />
                    <Typography color="common.white" sx={{ mt: 2 }} variant="h6">
                      Variant stock
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)' }} variant="body2">
                      Sizes and colors are tracked separately for accurate stock control.
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none' }}>
                  <CardContent>
                    <LockOutlinedIcon sx={{ color: 'common.white' }} />
                    <Typography color="common.white" sx={{ mt: 2 }} variant="h6">
                      Role-aware
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)' }} variant="body2">
                      Admin and cashier access already have a clear separation.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5">Sign in</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  Use an active Supabase Auth account with a matching profile row.
                </Typography>
              </Box>

              {(error || authError) && <Alert severity="error">{error ?? authError}</Alert>}
              {!isSupabaseConfigured && (
                <Alert severity="warning">
                  Supabase Auth is required for production sign-in. Add the Vite Supabase URL and
                  anon key environment variables, then create Auth users and profiles in Supabase.
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                  <TextField
                    label="Password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                  <Button
                    disabled={!isSupabaseConfigured || isSubmitting || authStatus === 'loading'}
                    endIcon={<ArrowForwardOutlinedIcon />}
                    size="large"
                    type="submit"
                    variant="contained"
                  >
                    {isSubmitting || authStatus === 'loading'
                      ? 'Checking access...'
                      : 'Enter workspace'}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
