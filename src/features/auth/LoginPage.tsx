import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
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
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

const desktopBreakpoint = '@media (min-width:1024px)';
const tabletBreakpoint = '@media (min-width:768px) and (max-width:1023px)';
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          'radial-gradient(circle at 14% 8%, rgba(47, 125, 80, 0.18), transparent 30%), radial-gradient(circle at 90% 18%, rgba(15, 91, 79, 0.1), transparent 28%), linear-gradient(135deg, #eef4ee 0%, #f9faf6 44%, #edf2ec 100%)',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100dvh',
        p: { xs: 0, sm: 2.5 },
        [tabletBreakpoint]: {
          alignItems: 'center',
          p: 3,
        },
        [desktopBreakpoint]: {
          alignItems: 'center',
          p: 3,
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: 'common.white',
          borderRadius: { xs: 0, sm: 4 },
          boxShadow: { sm: '0 26px 80px rgba(4, 20, 14, 0.18)' },
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '100%', sm: 680 },
          minHeight: { xs: '100dvh', sm: 'auto' },
          overflow: 'hidden',
          width: '100%',
          [tabletBreakpoint]: {
            maxWidth: 620,
            minHeight: 'auto',
          },
          [desktopBreakpoint]: {
            backgroundColor: 'transparent',
            borderRadius: 0,
            boxShadow: 'none',
            display: 'grid',
            gap: 3.25,
            gridTemplateColumns: 'minmax(590px, 1.14fr) minmax(420px, 0.86fr)',
            maxWidth: 1210,
            minHeight: 'min(784px, calc(100dvh - 48px))',
            overflow: 'visible',
          },
        }}
      >
        <LoginHeroDesktop />
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

function LoginHeroDesktop() {
  return (
    <Box
      component="section"
      sx={{
        background:
          'radial-gradient(circle at 50% 8%, rgba(255, 255, 255, 0.18), transparent 16%), radial-gradient(circle at 76% 28%, rgba(103, 207, 128, 0.36), transparent 24%), radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.12), transparent 18%), linear-gradient(148deg, #04100c 0%, #071f18 44%, #0d5e39 100%)',
        color: 'common.white',
        minHeight: { xs: 304, sm: 344 },
        overflow: 'hidden',
        p: { xs: 2.5, sm: 3.5 },
        position: 'relative',
        [tabletBreakpoint]: {
          minHeight: 372,
          p: 4,
        },
        [desktopBreakpoint]: {
          borderRadius: 3,
          boxShadow: '0 30px 76px rgba(2, 18, 11, 0.28)',
          minHeight: 'inherit',
          p: 5,
        },
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
          background:
            'linear-gradient(120deg, rgba(255,255,255,0.18), transparent 42%), linear-gradient(72deg, transparent 0 42%, rgba(199,242,210,0.12) 43% 44%, transparent 45%)',
          height: '74%',
          left: { xs: -90, md: -70 },
          opacity: 0.44,
          pointerEvents: 'none',
          position: 'absolute',
          top: -80,
          transform: 'skewX(-16deg)',
          width: '62%',
          [desktopBreakpoint]: {
            opacity: 0.68,
            width: '54%',
          },
        }}
      />
      <SportsSoccerOutlinedIcon
        sx={{
          bottom: { xs: 42, sm: 54 },
          color: 'rgba(255,255,255,0.08)',
          fontSize: { xs: 148, sm: 188 },
          left: { xs: -34, sm: -26 },
          position: 'absolute',
          transform: 'rotate(-14deg)',
          [desktopBreakpoint]: {
            bottom: 120,
            fontSize: 230,
            left: 28,
          },
        }}
      />
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: '50%',
          bottom: { xs: 10, sm: 24, md: 52 },
          height: { xs: 190, sm: 240, md: 320 },
          opacity: 0.54,
          position: 'absolute',
          right: { xs: -78, sm: -42, md: -96 },
          width: { xs: 190, sm: 240, md: 320 },
        }}
      />
      <Box
        sx={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 28px), linear-gradient(180deg, transparent, rgba(7, 54, 32, 0.62))',
          bottom: 0,
          height: { xs: 78, sm: 104, md: 164 },
          insetInline: 0,
          opacity: 0.5,
          position: 'absolute',
          transform: 'perspective(420px) rotateX(58deg)',
          transformOrigin: 'bottom',
        }}
      />
      <Box
        sx={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.9) 0 2px, transparent 3px)',
          backgroundSize: { xs: '22px 19px', sm: '26px 22px' },
          bottom: { xs: 22, md: 74 },
          height: { xs: 68, sm: 86 },
          opacity: 0.22,
          position: 'absolute',
          right: { xs: 18, md: 72 },
          transform: 'rotate(-8deg)',
          width: { xs: 138, sm: 190 },
        }}
      />

      <Stack
        spacing={{ xs: 3.05, sm: 4.25, md: 7 }}
        sx={{
          alignItems: { xs: 'center', md: 'stretch' },
          height: '100%',
          position: 'relative',
          textAlign: { xs: 'center', md: 'left' },
          zIndex: 1,
          [desktopBreakpoint]: {
            justifyContent: 'space-between',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 1.25 }}
          sx={{ alignItems: 'center' }}
        >
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.24)',
              borderRadius: 3,
              boxShadow: '0 12px 30px rgba(0,0,0,0.16)',
              display: 'flex',
              height: { xs: 42, sm: 46 },
              justifyContent: 'center',
              width: { xs: 42, sm: 46 },
            }}
          >
            <SportsSoccerOutlinedIcon sx={{ color: '#d8f6df', fontSize: { xs: 23, sm: 24 } }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, letterSpacing: '-0.04em' }} variant="h6">
              Sport Corner
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.72)' }} variant="caption">
              Football Boots & Gear
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ maxWidth: { xs: 330, sm: 500 } }}>
          <Typography
            sx={{
              fontSize: { xs: 33, sm: 44 },
              fontWeight: 900,
              letterSpacing: { xs: '0.085em', sm: '0.08em' },
              lineHeight: 0.96,
              textShadow: { xs: '0 12px 30px rgba(0,0,0,0.28)', md: 'none' },
              textTransform: 'uppercase',
              [desktopBreakpoint]: {
                fontSize: 66,
                letterSpacing: '0.1em',
                textShadow: '0 16px 44px rgba(0,0,0,0.28)',
              },
            }}
          >
            SPORT
            <br />
            CORNER
          </Typography>
          <Typography
            sx={{
              color: '#c9f3d1',
              fontSize: { xs: 15, sm: 17, md: 20 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              mt: 1.35,
            }}
          >
            Football Boots & Gear
          </Typography>
          <Box
            sx={{
              background:
                'linear-gradient(90deg, transparent, rgba(215,246,223,0.76), transparent)',
              height: 1,
              mt: { xs: 1.75, sm: 2 },
              mx: 'auto',
              width: { xs: 154, sm: 190 },
              [desktopBreakpoint]: {
                display: 'none',
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'none',
            [desktopBreakpoint]: {
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              maxWidth: 610,
              position: 'relative',
              zIndex: 4,
            },
          }}
        >
          <HeroFeatureCard
            description="Fast daily setup"
            icon={<BoltOutlinedIcon fontSize="small" />}
            title="Fast setup"
          />
          <HeroFeatureCard
            description="Track every size"
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            title="Variant stock"
          />
          <HeroFeatureCard
            description="Admin and cashier"
            icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
            title="Role-aware"
          />
        </Box>
      </Stack>

      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.07))',
          border: '1px solid rgba(255,255,255,0.24)',
          borderRadius: { xs: 3.25, sm: 4.5 },
          bottom: { xs: 16, sm: 23 },
          boxShadow: '0 22px 46px rgba(0, 0, 0, 0.34)',
          p: { xs: 1, md: 1.3 },
          position: 'absolute',
          right: { xs: 18, sm: 34 },
          transform: 'rotate(-7deg)',
          width: { xs: 118, sm: 148 },
          zIndex: 2,
          [tabletBreakpoint]: {
            bottom: 28,
            right: 48,
            width: 168,
          },
          [desktopBreakpoint]: {
            bottom: 164,
            right: 54,
            transform: 'rotate(-8deg)',
            width: 210,
          },
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

function HeroFeatureCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Box
      sx={{
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 2.5,
        boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
        p: 1.6,
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: 'rgba(215,246,223,0.16)',
            borderRadius: 2,
            color: '#d7f6df',
            display: 'flex',
            height: 34,
            justifyContent: 'center',
            width: 34,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography color="common.white" sx={{ fontWeight: 800 }} variant="body2">
            {title}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.66)', mt: 0.25 }} variant="caption">
            {description}
          </Typography>
        </Box>
      </Stack>
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
        borderTopLeftRadius: { xs: 28, sm: 32, md: 0 },
        borderTopRightRadius: { xs: 28, sm: 32, md: 0 },
        boxShadow: { xs: '0 -18px 44px rgba(3, 19, 13, 0.16)', md: 'none' },
        display: 'flex',
        flex: 1,
        mt: { xs: -32, md: 0 },
        p: { xs: 2.5, sm: 3.75 },
        position: 'relative',
        zIndex: 3,
        [tabletBreakpoint]: {
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          mt: -38,
          p: 4.25,
        },
        [desktopBreakpoint]: {
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderRadius: 0,
          boxShadow: 'none',
          mt: 0,
          p: 0,
        },
      }}
    >
      <Stack
        spacing={{ xs: 2.55, sm: 2.75, md: 3 }}
        sx={{
          backgroundColor: 'common.white',
          border: { xs: 'none', md: '1px solid rgba(219, 225, 215, 0.78)' },
          borderRadius: { xs: 0, md: 3 },
          boxShadow: { md: '0 24px 66px rgba(21, 34, 29, 0.14)' },
          justifyContent: 'center',
          maxWidth: { xs: 430, md: 462 },
          mx: 'auto',
          p: { xs: 0, md: 4.35 },
          width: '100%',
          [tabletBreakpoint]: {
            maxWidth: 500,
          },
        }}
      >
        <Box>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: { xs: 28, sm: 31, md: 34 },
              fontWeight: 850,
              letterSpacing: '-0.05em',
            }}
          >
            Welcome back {'\u{1F44B}'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.85 }} variant="body2">
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
          <Stack spacing={{ xs: 1.85, sm: 2 }}>
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
                      <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 21 }} />
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
                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 21 }} />
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
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 21 }} />
                        ) : (
                          <VisibilityOutlinedIcon sx={{ fontSize: 21 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />

            <Stack
              direction={{ xs: 'row' }}
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: -0.5,
                gap: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => onRememberMeChange(event.target.checked)}
                    sx={{
                      color: '#9ba8a1',
                      p: { xs: 0.8, sm: 0.75 },
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
                  fontSize: { xs: 13.5, sm: 14 },
                  fontWeight: 700,
                  minHeight: 34,
                  px: 0.25,
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
                background: 'linear-gradient(135deg, #0a4f43 0%, #11824b 58%, #1a9a58 100%)',
                borderRadius: 3.25,
                boxShadow:
                  '0 16px 30px rgba(13, 89, 74, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                minHeight: { xs: 56, sm: 54 },
                mt: 0.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #083f36 0%, #0f7444 58%, #178b50 100%)',
                  boxShadow:
                    '0 18px 34px rgba(13, 89, 74, 0.36), inset 0 1px 0 rgba(255,255,255,0.18)',
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
            pt: 0.1,
          }}
        >
          <ShieldOutlinedIcon sx={{ color: '#0d594a', fontSize: 18 }} />
          <Typography variant="caption">Secure login with Supabase Auth</Typography>
        </Stack>

        <LoginFeatureCard />

        <Typography
          color="text.secondary"
          sx={{ fontSize: 12, pt: { xs: 0.2, sm: 0.35 }, textAlign: 'center' }}
          variant="caption"
        >
          {'\u00A9'} 2025 Sport Corner. All rights reserved.
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
          'linear-gradient(135deg, rgba(215, 239, 227, 0.98), rgba(247, 252, 248, 0.96))',
        border: '1px solid rgba(13, 89, 74, 0.2)',
        borderRadius: 3.5,
        boxShadow: '0 14px 34px rgba(18, 44, 31, 0.1)',
        p: { xs: 1.9, sm: 2 },
      }}
    >
      <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            alignItems: 'center',
            background: 'linear-gradient(145deg, #0a4f43, #16804e)',
            borderRadius: 3,
            boxShadow: '0 10px 20px rgba(13, 89, 74, 0.24)',
            color: 'common.white',
            display: 'flex',
            flexShrink: 0,
            height: { xs: 40, sm: 42 },
            justifyContent: 'center',
            width: { xs: 40, sm: 42 },
          }}
        >
          <StorefrontOutlinedIcon sx={{ fontSize: 21 }} />
        </Box>
        <Box>
          <Typography
            sx={{ color: 'text.primary', fontWeight: 850, letterSpacing: '-0.035em' }}
            variant="body1"
          >
            Built for speed. Made for your shop.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: 13.5, sm: 14 }, mt: 0.35 }}
            variant="body2"
          >
            Manage inventory, track stock, and sell with ease.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

const fieldSx = {
  '& .MuiInputLabel-root': {
    color: '#65736b',
    fontWeight: 650,
    '&.Mui-focused': {
      color: '#0a4f43',
    },
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fffefa',
    borderRadius: 3,
    boxShadow: '0 8px 22px rgba(28, 48, 39, 0.05)',
    minHeight: { xs: 58, sm: 56 },
    transition: 'box-shadow 160ms ease, background-color 160ms ease',
    '& fieldset': {
      borderColor: '#cfdcd4',
    },
    '&:hover fieldset': {
      borderColor: '#91aa9b',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0a4f43',
      borderWidth: 2,
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 4px rgba(13, 89, 74, 0.1), 0 12px 28px rgba(28, 48, 39, 0.08)',
    },
    '& input': {
      color: '#17231e',
      fontWeight: 550,
    },
    '& input::placeholder': {
      color: '#7a8980',
      opacity: 1,
    },
  },
};
