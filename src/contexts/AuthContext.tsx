import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  fetchCurrentProfile,
  fetchProfiles,
  saveProfile,
} from '../services/profileService';
import {
  emptySystemSettings,
  fetchSystemSettings,
  saveSupabaseSettings,
} from '../services/settingsService';
import type {
  OperationResult,
  SystemSettings,
  SystemSettingsInput,
  UserProfile,
  UserProfileInput,
  UserSession,
} from '../types/models';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  session: UserSession | null;
  profile: UserProfile | null;
  users: UserProfile[];
  settings: SystemSettings;
  authStatus: AuthStatus;
  authError: string | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<OperationResult>;
  logout: () => Promise<void>;
  refreshProfiles: () => Promise<OperationResult>;
  updateUserProfile: (
    profileId: string,
    input: UserProfileInput,
  ) => Promise<OperationResult>;
  saveSettings: (input: SystemSettingsInput) => Promise<OperationResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildSession(profile: UserProfile): UserSession {
  return {
    id: profile.id,
    name: profile.fullName.trim() || profile.email,
    email: profile.email,
    role: profile.appRole,
    status: profile.status,
  };
}

function buildFailure(message: string): OperationResult {
  return {
    ok: false,
    message,
  };
}

function validateProfileInput(input: UserProfileInput) {
  if (!input.fullName.trim()) {
    return 'Full name is required.';
  }

  return null;
}

function validateSettingsInput(input: SystemSettingsInput) {
  if (!input.storeName.trim()) {
    return 'Store name is required.';
  }

  if (!input.branchName.trim()) {
    return 'Branch name is required.';
  }

  return null;
}

function formatAuthError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(emptySystemSettings);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'unauthenticated',
  );
  const [authError, setAuthError] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : 'Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before signing in.',
  );
  const signOutMessageRef = useRef<string | null>(null);

  const clearAuthState = (message: string | null = null) => {
    setSession(null);
    setProfile(null);
    setUsers([]);
    setSettings(emptySystemSettings);
    setAuthStatus('unauthenticated');
    setAuthError(message);
  };

  const signOutSafely = async (message: string) => {
    signOutMessageRef.current = message;

    if (supabase) {
      await supabase.auth.signOut();
    }

    clearAuthState(message);
  };

  const loadWorkspaceState = async (nextProfile: UserProfile) => {
    const workspaceErrors: string[] = [];
    await fetchSystemSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
      })
      .catch((error) => {
        setSettings(emptySystemSettings);
        workspaceErrors.push(
          `Store settings could not be loaded: ${formatAuthError(error)}`,
        );
      });

    if (nextProfile.appRole !== 'admin') {
      setUsers([nextProfile]);
      return workspaceErrors;
    }

    await fetchProfiles()
      .then((nextUsers) => {
        setUsers(nextUsers);
      })
      .catch((error) => {
        setUsers([nextProfile]);
        workspaceErrors.push(
          `Profile directory could not be loaded: ${formatAuthError(error)}`,
        );
      });

    return workspaceErrors;
  };

  const applySupabaseSession = async (
    nextAuthSession: SupabaseSession | null,
  ): Promise<OperationResult> => {
    if (!nextAuthSession) {
      clearAuthState();
      return { ok: true, message: 'Signed out.' };
    }

    setAuthStatus('loading');
    setAuthError(null);

    try {
      const nextProfile = await fetchCurrentProfile();

      if (!nextProfile) {
        const message =
          'Your Supabase Auth user does not have a profile yet. Ask an admin to create or repair your profile before signing in.';
        await signOutSafely(message);
        return buildFailure(message);
      }

      if (nextProfile.status !== 'active') {
        const message = 'Your account profile is inactive. Ask an admin to reactivate it.';
        await signOutSafely(message);
        return buildFailure(message);
      }

      const nextSession = buildSession(nextProfile);
      setProfile(nextProfile);
      setSession(nextSession);

      const workspaceErrors = await loadWorkspaceState(nextProfile);
      setAuthStatus('authenticated');
      setAuthError(workspaceErrors[0] ?? null);

      return {
        ok: true,
        message: `Welcome back, ${nextSession.name}.`,
      };
    } catch (error) {
      const message = `Signed in, but your profile could not be loaded safely: ${formatAuthError(error)}`;
      await signOutSafely(message);
      return buildFailure(message);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      clearAuthState(
        'Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before signing in.',
      );
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        clearAuthState(`Could not restore your Supabase session: ${error.message}`);
        return;
      }

      await applySupabaseSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextAuthSession) => {
      if (event === 'SIGNED_OUT') {
        const message = signOutMessageRef.current;
        signOutMessageRef.current = null;
        clearAuthState(message);
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void applySupabaseSession(nextAuthSession);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfiles = async (): Promise<OperationResult> => {
    if (!profile) {
      return buildFailure('Sign in before loading profiles.');
    }

    if (profile.appRole !== 'admin') {
      setUsers([profile]);
      return { ok: true, message: 'Current profile loaded.' };
    }

    try {
      const nextUsers = await fetchProfiles();
      setUsers(nextUsers);
      return { ok: true, message: 'Profiles refreshed successfully.' };
    } catch (error) {
      return buildFailure(`Could not refresh profiles: ${formatAuthError(error)}`);
    }
  };

  const updateUserProfile = async (
    profileId: string,
    input: UserProfileInput,
  ): Promise<OperationResult> => {
    if (!profile || profile.appRole !== 'admin') {
      return buildFailure('Only admins can update profile roles and status.');
    }

    const validationMessage = validateProfileInput(input);

    if (validationMessage) {
      return buildFailure(validationMessage);
    }

    const existingProfile = users.find((user) => user.id === profileId);

    if (!existingProfile) {
      return buildFailure('Profile not found.');
    }

    const changingOwnAccess =
      profile.id === profileId &&
      (input.appRole !== profile.appRole || input.status !== profile.status);

    if (changingOwnAccess) {
      return buildFailure('You cannot change your own role or status while signed in.');
    }

    const activeAdminCount = users.filter(
      (user) => user.appRole === 'admin' && user.status === 'active',
    ).length;
    const removingLastAdmin =
      existingProfile.appRole === 'admin' &&
      existingProfile.status === 'active' &&
      activeAdminCount === 1 &&
      (input.appRole !== 'admin' || input.status !== 'active');

    if (removingLastAdmin) {
      return buildFailure('At least one active admin profile must remain in the system.');
    }

    const remoteResult = await saveProfile(profileId, input);

    if (!remoteResult.ok || !remoteResult.record) {
      return buildFailure(remoteResult.message);
    }

    setUsers((current) =>
      current.map((user) => (user.id === profileId ? remoteResult.record! : user)),
    );

    if (profile.id === profileId) {
      setProfile(remoteResult.record);
      setSession(buildSession(remoteResult.record));
    }

    return { ok: true, message: 'Profile updated successfully.' };
  };

  const value: AuthContextValue = {
    session,
    profile,
    users,
    settings,
    authStatus,
    authError,
    isAuthLoading: authStatus === 'loading',
    login: async (email, password) => {
      if (!isSupabaseConfigured || !supabase) {
        const message =
          'Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before signing in.';
        setAuthError(message);
        return buildFailure(message);
      }

      setAuthStatus('loading');
      setAuthError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        clearAuthState(error.message || 'Invalid email or password.');
        return buildFailure(error.message || 'Invalid email or password.');
      }

      return applySupabaseSession(data.session);
    },
    logout: async () => {
      signOutMessageRef.current = null;

      if (supabase) {
        await supabase.auth.signOut();
      }

      clearAuthState();
    },
    refreshProfiles,
    updateUserProfile,
    saveSettings: async (input) => {
      if (!profile || profile.appRole !== 'admin') {
        return buildFailure('Only admins can update store settings.');
      }

      const validationMessage = validateSettingsInput(input);

      if (validationMessage) {
        return buildFailure(validationMessage);
      }

      const nextSettings: SystemSettings = {
        storeName: input.storeName.trim(),
        branchName: input.branchName.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        receiptFooter: input.receiptFooter.trim(),
        reportFooter: input.reportFooter.trim(),
      };
      const remoteResult = await saveSupabaseSettings(nextSettings);

      if (!remoteResult.ok || !remoteResult.record) {
        return buildFailure(remoteResult.message);
      }

      setSettings(remoteResult.record);
      return { ok: true, message: 'Settings saved successfully.' };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
