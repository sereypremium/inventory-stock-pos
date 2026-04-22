import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { mockSystemSettings, mockUsers } from '../data/mockData';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  deleteSupabaseUser,
  fetchSupabaseAuthStore,
  saveSupabaseSettings,
  saveSupabaseUser,
} from '../services/supabaseAuthStore';
import type {
  AppUser,
  MockAccount,
  OperationResult,
  SystemSettings,
  SystemSettingsInput,
  UserInput,
  UserSession,
} from '../types/models';

interface AuthContextValue {
  session: UserSession | null;
  users: AppUser[];
  settings: SystemSettings;
  login: (email: string, password: string) => Promise<OperationResult>;
  logout: () => void;
  addUser: (input: UserInput) => Promise<OperationResult>;
  updateUser: (userId: string, input: UserInput) => Promise<OperationResult>;
  deleteUser: (userId: string) => Promise<OperationResult>;
  saveSettings: (input: SystemSettingsInput) => Promise<OperationResult>;
  demoAccounts: MockAccount[];
}

const AUTH_STORAGE_KEY = 'bootroom-pos.auth-session';
const USERS_STORAGE_KEY = 'bootroom-pos.auth-users';
const SETTINGS_STORAGE_KEY = 'bootroom-pos.system-settings';

const emptySystemSettings: SystemSettings = {
  storeName: '',
  branchName: '',
  address: '',
  phone: '',
  receiptFooter: '',
  reportFooter: '',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(session: UserSession | null) {
  if (session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function buildSession(user: AppUser): UserSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function normalizeUsers(value: unknown) {
  if (!Array.isArray(value)) {
    return mockUsers;
  }

  return value.map((entry, index) => {
    const candidate = entry as Partial<AppUser>;
    const fallback = mockUsers[index] ?? mockUsers[0];

    return {
      id: candidate.id ?? crypto.randomUUID(),
      name: candidate.name?.trim() || fallback.name,
      email: candidate.email?.trim().toLowerCase() || fallback.email,
      password: candidate.password?.trim() || fallback.password,
      role: candidate.role === 'cashier' ? 'cashier' : 'admin',
      status: candidate.status === 'inactive' ? 'inactive' : 'active',
      createdAt: candidate.createdAt ?? fallback.createdAt,
      updatedAt: candidate.updatedAt ?? fallback.updatedAt,
    } satisfies AppUser;
  });
}

function getInitialUsers() {
  if (isSupabaseConfigured) {
    return [];
  }

  if (typeof window === 'undefined') {
    return mockUsers;
  }

  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!storedUsers) {
    return mockUsers;
  }

  try {
    return normalizeUsers(JSON.parse(storedUsers));
  } catch {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return mockUsers;
  }
}

function getInitialSettings() {
  if (isSupabaseConfigured) {
    return emptySystemSettings;
  }

  if (typeof window === 'undefined') {
    return mockSystemSettings;
  }

  const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!storedSettings) {
    return mockSystemSettings;
  }

  try {
    const parsed = JSON.parse(storedSettings) as Partial<SystemSettings>;

    return {
      storeName: parsed.storeName?.trim() || mockSystemSettings.storeName,
      branchName: parsed.branchName?.trim() || mockSystemSettings.branchName,
      address: parsed.address?.trim() || mockSystemSettings.address,
      phone: parsed.phone?.trim() || mockSystemSettings.phone,
      receiptFooter: parsed.receiptFooter?.trim() || mockSystemSettings.receiptFooter,
      reportFooter: parsed.reportFooter?.trim() || mockSystemSettings.reportFooter,
    } satisfies SystemSettings;
  } catch {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    return mockSystemSettings;
  }
}

function getInitialSession(users: AppUser[]) {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as UserSession;

    if (isSupabaseConfigured) {
      return parsed;
    }

    const matchedUser = users.find(
      (user) => user.id === parsed.id && user.status === 'active',
    );

    if (!matchedUser) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return buildSession(matchedUser);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function validateUserInput(input: UserInput) {
  if (!input.name.trim()) {
    return 'User name is required.';
  }

  if (!input.email.trim()) {
    return 'User email is required.';
  }

  if (!input.password.trim() || input.password.trim().length < 6) {
    return 'Password must be at least 6 characters.';
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

function persistUsers(users: AppUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function persistSettings(settings: SystemSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => getInitialUsers());
  const [settings, setSettings] = useState<SystemSettings>(() => getInitialSettings());
  const [session, setSession] = useState<UserSession | null>(() => getInitialSession(users));
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);

  const syncSessionWithUser = (user: AppUser | null) => {
    if (!user) {
      persistSession(null);
      setSession(null);
      return;
    }

    const nextSession = buildSession(user);
    persistSession(nextSession);
    setSession(nextSession);
  };

  const updateUsers = (updater: (current: AppUser[]) => AppUser[]) => {
    setUsers((current) => {
      const nextUsers = updater(current);
      persistUsers(nextUsers);
      return nextUsers;
    });
  };

  const applySettings = (nextSettings: SystemSettings) => {
    setSettings(nextSettings);
    persistSettings(nextSettings);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsSyncing(false);
      return;
    }

    let active = true;

    setIsSyncing(true);

    void fetchSupabaseAuthStore()
      .then((remoteStore) => {
        if (!active) {
          return;
        }

        setUsers(remoteStore.users);
        persistUsers(remoteStore.users);
        applySettings(remoteStore.settings);

        setSession((currentSession) => {
          const storedSession = currentSession ?? getInitialSession(remoteStore.users);

          if (!storedSession) {
            persistSession(null);
            return null;
          }

          const matchedUser = remoteStore.users.find(
            (user) => user.id === storedSession.id && user.status === 'active',
          );

          if (!matchedUser) {
            persistSession(null);
            return null;
          }

          const nextSession = buildSession(matchedUser);
          persistSession(nextSession);
          return nextSession;
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setUsers([]);
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setIsSyncing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value: AuthContextValue = {
    session,
    users,
    settings,
    demoAccounts: users.filter((user) => user.status === 'active') as MockAccount[],
    login: async (email, password) => {
      if (isSupabaseConfigured && isSyncing) {
        return {
          ok: false,
          message: 'Accounts are still syncing from Supabase. Please wait a moment and try again.',
        };
      }

      const match = users.find(
        (user) =>
          user.status === 'active' &&
          user.email.toLowerCase() === email.trim().toLowerCase() &&
          user.password === password,
      );

      if (!match) {
        return {
          ok: false,
          message:
            users.length === 0
              ? 'No active accounts are available in the current workspace data source.'
              : 'Invalid credentials. Use one of the active accounts shown on the page.',
        };
      }

      syncSessionWithUser(match);

      return {
        ok: true,
        message: `Welcome back, ${match.name}.`,
      };
    },
    logout: () => {
      syncSessionWithUser(null);
    },
    addUser: async (input) => {
      const validationMessage = validateUserInput(input);

      if (validationMessage) {
        return { ok: false, message: validationMessage };
      }

      const duplicateEmail = users.some(
        (user) => user.email.toLowerCase() === input.email.trim().toLowerCase(),
      );

      if (duplicateEmail) {
        return { ok: false, message: 'User email already exists.' };
      }

      let nextUser: AppUser = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password.trim(),
        role: input.role,
        status: input.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const remoteResult = await saveSupabaseUser(nextUser);

        if (!remoteResult.ok || !remoteResult.record) {
          return { ok: false, message: remoteResult.message };
        }

        nextUser = remoteResult.record;
      }

      updateUsers((current) => [nextUser, ...current]);

      return { ok: true, message: 'User saved successfully.' };
    },
    updateUser: async (userId, input) => {
      const validationMessage = validateUserInput(input);

      if (validationMessage) {
        return { ok: false, message: validationMessage };
      }

      const existingUser = users.find((user) => user.id === userId);

      if (!existingUser) {
        return { ok: false, message: 'User not found.' };
      }

      if (
        session?.id === userId &&
        input.status === 'inactive'
      ) {
        return { ok: false, message: 'You cannot deactivate your own active account.' };
      }

      const duplicateEmail = users.some(
        (user) =>
          user.id !== userId && user.email.toLowerCase() === input.email.trim().toLowerCase(),
      );

      if (duplicateEmail) {
        return { ok: false, message: 'User email already exists.' };
      }

      const activeAdminCount = users.filter(
        (user) => user.role === 'admin' && user.status === 'active',
      ).length;
      const removingLastAdmin =
        existingUser.role === 'admin' &&
        existingUser.status === 'active' &&
        activeAdminCount === 1 &&
        (input.role !== 'admin' || input.status !== 'active');

      if (removingLastAdmin) {
        return {
          ok: false,
          message: 'At least one active admin account must remain in the system.',
        };
      }

      let nextUser: AppUser = {
        ...existingUser,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password.trim(),
        role: input.role,
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const remoteResult = await saveSupabaseUser(nextUser);

        if (!remoteResult.ok || !remoteResult.record) {
          return { ok: false, message: remoteResult.message };
        }

        nextUser = remoteResult.record;
      }

      updateUsers((current) =>
        current.map((user) => (user.id === userId ? nextUser : user)),
      );

      if (session?.id === userId) {
        syncSessionWithUser(nextUser);
      }

      return { ok: true, message: 'User updated successfully.' };
    },
    deleteUser: async (userId) => {
      const existingUser = users.find((user) => user.id === userId);

      if (!existingUser) {
        return { ok: false, message: 'User not found.' };
      }

      if (session?.id === userId) {
        return { ok: false, message: 'You cannot delete the account you are currently using.' };
      }

      const activeAdminCount = users.filter(
        (user) => user.role === 'admin' && user.status === 'active',
      ).length;
      const deletingLastAdmin =
        existingUser.role === 'admin' &&
        existingUser.status === 'active' &&
        activeAdminCount === 1;

      if (deletingLastAdmin) {
        return {
          ok: false,
          message: 'At least one active admin account must remain in the system.',
        };
      }

      if (isSupabaseConfigured) {
        const remoteResult = await deleteSupabaseUser(userId);

        if (!remoteResult.ok) {
          return { ok: false, message: remoteResult.message };
        }
      }

      updateUsers((current) => current.filter((user) => user.id !== userId));

      return { ok: true, message: 'User deleted successfully.' };
    },
    saveSettings: async (input) => {
      const validationMessage = validateSettingsInput(input);

      if (validationMessage) {
        return { ok: false, message: validationMessage };
      }

      let nextSettings: SystemSettings = {
        storeName: input.storeName.trim(),
        branchName: input.branchName.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        receiptFooter: input.receiptFooter.trim(),
        reportFooter: input.reportFooter.trim(),
      };

      if (isSupabaseConfigured) {
        const remoteResult = await saveSupabaseSettings(nextSettings);

        if (!remoteResult.ok || !remoteResult.record) {
          return { ok: false, message: remoteResult.message };
        }

        nextSettings = remoteResult.record;
      }

      applySettings(nextSettings);

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
