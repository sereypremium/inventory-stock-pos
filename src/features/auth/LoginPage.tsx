import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
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
import { useInventory } from '../../contexts/InventoryContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { demoAccounts, login } = useAuth();
  const { isDatabaseConnected, isSyncing } = useInventory();
  const [email, setEmail] = useState(demoAccounts[0]?.email ?? '');
  const [password, setPassword] = useState(demoAccounts[0]?.password ?? '');
  const [error, setError] = useState<string | null>(null);

  const nextPath =
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = login(email, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    navigate(nextPath, { replace: true });
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
                    label={
                      isDatabaseConnected
                        ? 'Database connected'
                        : isSyncing
                          ? 'Connecting...'
                          : 'Mock mode'
                    }
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
                  This Phase 1 workspace covers the core catalog setup: brands, categories,
                  products, and size-color variants with stock visibility at the variant level.
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
                  Use one of the demo accounts below while Supabase auth is not connected yet.
                </Typography>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                {demoAccounts.map((account) => (
                  <Card key={account.id} variant="outlined">
                    <CardActionArea
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                        setError(null);
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2">{account.name}</Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                              {account.email}
                            </Typography>
                          </Box>
                          <Chip
                            color={account.role === 'admin' ? 'primary' : 'secondary'}
                            label={account.role}
                            size="small"
                          />
                        </Stack>
                        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
                          Password: {account.password}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>

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
                  <Button endIcon={<ArrowForwardOutlinedIcon />} size="large" type="submit" variant="contained">
                    Enter workspace
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
