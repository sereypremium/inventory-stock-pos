import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

const heroBootImage = '/product-images/mercurial-vapor-16.svg';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authError, authStatus, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
        background:
          'radial-gradient(circle at top left, rgba(77, 160, 111, 0.22), transparent 32%), linear-gradient(180deg, #06130f 0%, #0b1a14 43%, #f5f7f2 43%, #f5f7f2 100%)',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100dvh',
        p: { xs: 0, sm: 2.5, lg: 4 },
      }}
    >
      <Box
        sx={{
          backgroundColor: 'common.white',
          borderRadius: { xs: 0, md: 4 },
          boxShadow: { md: '0 26px 80px rgba(4, 20, 14, 0.28)' },
          display: { xs: 'flex', md: 'grid' },
          flexDirection: 'column',
          gridTemplateColumns: { md: 'minmax(0, 1fr) minmax(420px, 0.82fr)' },
          maxWidth: { xs: '100%', md: 1120 },
          minHeight: { xs: '100dvh', md: 'min(760px, calc(100dvh - 64px))' },
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <LoginHero />
        <LoginFormCard
          authError={authError}
          authStatus={authStatus}
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          onEmailChange={(value) => {
            setEmail(value);
            setError(null);
          }}
          onForgotPassword={() => {
            setError(
              'Password resets are managed by Supabase Auth. Ask an admin to send a reset link for your account.',
            );
          }}
          onPasswordChange={(value) => {
            setPassword(value);
            setError(null);
          }}
          onRememberMeChange={setRememberMe}
          onShowPasswordChange={() => setShowPassword((current) => !current)}
          onSubmit={handleSubmit}
          password={password}
          rememberMe={rememberMe}
          showPassword={showPassword}
        />
      </Box>
    </Box>
  );
}

function LoginHero() {
  return (
    <Box
      component="section"
      sx={{
        background:
          'radial-gradient(circle at 76% 25%, rgba(104, 205, 129, 0.34), transparent 22%), radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.16), transparent 18%), linear-gradient(145deg, #06120e 0%, #0b2b20 48%, #0f5b38 100%)',
        color: 'common.white',
        minHeight: { xs: 354, sm: 410, md: 'auto' },
        overflow: 'hidden',
        p: { xs: 2.75, sm: 4, md: 5 },
        position: 'relative',
      }}
    >
      <Box
        sx={{
          background:
            'linear-gradient(115deg, transparent 0 38%, rgba(255,255,255,0.08) 38% 39%, transparent 39% 100%)',
          inset: 0,
          opacity: 0.85,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '50%',
          bottom: { xs: 26, md: 52 },
          height: { xs: 220, md: 320 },
          opacity: 0.55,
          position: 'absolute',
          right: { xs: -86, sm: -42, md: -96 },
          width: { xs: 220, md: 320 },
        }}
      />
      <Box
        sx={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.9) 0 2px, transparent 3px)',
          backgroundSize: '26px 22px',
          bottom: { xs: 34, md: 74 },
          height: 86,
          opacity: 0.18,
          position: 'absolute',
          right: { xs: 20, md: 72 },
          transform: 'rotate(-8deg)',
          width: 190,
        }}
      />

      <Stack
        spacing={{ xs: 4.5, md: 7 }}
        sx={{ height: '100%', position: 'relative', zIndex: 1 }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 3,
              display: 'flex',
              height: 46,
              justifyContent: 'center',
              width: 46,
            }}
          >
            <SportsSoccerOutlinedIcon sx={{ color: '#d7f6df' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, letterSpacing: '-0.03em' }} variant="h6">
              Sport Corner
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.68)' }} variant="caption">
              Football Boots & Gear
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ maxWidth: 430 }}>
          <Typography
            sx={{
              fontSize: { xs: 36, sm: 46, md: 58 },
              fontWeight: 900,
              letterSpacing: { xs: '0.08em', md: '0.1em' },
              lineHeight: 0.96,
              textTransform: 'uppercase',
            }}
          >
            SPORT
            <br />
            CORNER
          </Typography>
          <Typography
            sx={{
              color: '#c7f2d2',
              fontSize: { xs: 17, md: 20 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              mt: 1.5,
            }}
          >
            Football Boots & Gear
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 5,
          bottom: { xs: 22, sm: 28, md: 56 },
          boxShadow: '0 22px 46px rgba(0, 0, 0, 0.34)',
          p: { xs: 1, md: 1.3 },
          position: 'absolute',
          right: { xs: 24, sm: 44, md: 62 },
          transform: 'rotate(-7deg)',
          width: { xs: 130, sm: 156, md: 190 },
          zIndex: 2,
        }}
      >
        <Box
          alt="Football boot visual"
          component="img"
          src={heroBootImage}
          sx={{
            borderRadius: 4,
            display: 'block',
            filter: 'saturate(1.08)',
            width: '100%',
          }}
        />
      </Box>
    </Box>
  );
}

function LoginFormCard({
  authError,
  authStatus,
  email,
  error,
  isSubmitting,
  onEmailChange,
  onForgotPassword,
  onPasswordChange,
  onRememberMeChange,
  onShowPasswordChange,
  onSubmit,
  password,
  rememberMe,
  showPassword,
}: {
  authError: string | null;
  authStatus: string;
  email: string;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onForgotPassword: () => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onShowPasswordChange: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
}) {
  const isBusy = isSubmitting || authStatus === 'loading';

  return (
    <Box
      component="section"
      sx={{
        backgroundColor: 'common.white',
        borderTopLeftRadius: { xs: 34, md: 0 },
        borderTopRightRadius: { xs: 34, md: 0 },
        boxShadow: { xs: '0 -18px 44px rgba(3, 19, 13, 0.18)', md: 'none' },
        display: 'flex',
        flex: 1,
        mt: { xs: -34, md: 0 },
        p: { xs: 2.75, sm: 4, md: 5 },
        position: 'relative',
        zIndex: 3,
      }}
    >
      <Stack
        spacing={{ xs: 2.75, md: 3 }}
        sx={{
          justifyContent: 'center',
          maxWidth: 430,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Box>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: { xs: 30, md: 34 },
              fontWeight: 850,
              letterSpacing: '-0.05em',
            }}
          >
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            Sign in to access your workspace
          </Typography>
        </Box>

        {(error || authError) && <Alert severity="error">{error ?? authError}</Alert>}
        {!isSupabaseConfigured && (
          <Alert severity="warning">
            Supabase Auth is required for production sign-in. Add the Vite Supabase URL and anon
            key environment variables, then create Auth users and profiles in Supabase.
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              autoComplete="email"
              fullWidth
              label="Email"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@sportcorner.com"
              required
              type="email"
              value={email}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
            <TextField
              autoComplete="current-password"
              fullWidth
              label="Password"
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter your password"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        edge="end"
                        onClick={onShowPasswordChange}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />

            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: -0.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => onRememberMeChange(event.target.checked)}
                    sx={{
                      color: '#9ba8a1',
                      p: 0.75,
                      '&.Mui-checked': { color: 'primary.main' },
                    }}
                  />
                }
                label={
                  <Typography color="text.secondary" variant="body2">
                    Remember me
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <MuiLink
                component="button"
                onClick={onForgotPassword}
                sx={{
                  color: 'primary.dark',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                type="button"
              >
                Forgot password?
              </MuiLink>
            </Stack>

            <Button
              disabled={!isSupabaseConfigured || isBusy}
              endIcon={<ArrowForwardOutlinedIcon />}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #0f5b4f, #17834f)',
                borderRadius: 3.25,
                boxShadow: '0 14px 24px rgba(15, 91, 79, 0.24)',
                minHeight: 54,
                mt: 0.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0a453c, #126f43)',
                  boxShadow: '0 16px 28px rgba(15, 91, 79, 0.28)',
                },
              }}
              type="submit"
              variant="contained"
            >
              {isBusy ? 'Checking access...' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            color: 'text.secondary',
            justifyContent: 'center',
          }}
        >
          <ShieldOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="caption">Secure login with Supabase Auth</Typography>
        </Stack>

        <LoginFeatureCard />

        <Typography
          color="text.secondary"
          sx={{ fontSize: 12, textAlign: 'center' }}
          variant="caption"
        >
          © 2025 Sport Corner. All rights reserved.
        </Typography>
      </Stack>
    </Box>
  );
}

function LoginFeatureCard() {
  return (
    <Box
      sx={{
        background:
          'linear-gradient(135deg, rgba(220, 239, 233, 0.96), rgba(255, 255, 255, 0.92))',
        border: '1px solid rgba(15, 91, 79, 0.14)',
        borderRadius: 4,
        boxShadow: '0 12px 34px rgba(18, 44, 31, 0.08)',
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: 'primary.main',
            borderRadius: 3,
            color: 'common.white',
            display: 'flex',
            flexShrink: 0,
            height: 42,
            justifyContent: 'center',
            width: 42,
          }}
        >
          <StorefrontOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, letterSpacing: '-0.03em' }} variant="body1">
            Built for speed. Made for your shop.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="body2">
            Manage inventory, track stock, and sell with ease.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    minHeight: 56,
    '& fieldset': {
      borderColor: '#dce5df',
    },
    '&:hover fieldset': {
      borderColor: '#9fb8aa',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0f5b4f',
      borderWidth: 1.5,
    },
  },
};
