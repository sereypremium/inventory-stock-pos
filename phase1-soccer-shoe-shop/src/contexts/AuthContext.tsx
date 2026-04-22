import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import {
  get_demo_accounts,
  get_stored_session,
  login_with_mock,
  logout_user,
} from '../services/authService';
import type { MockAccount, OperationResult, UserSession } from '../types/models';

interface AuthContextValue {
  session: UserSession | null;
  demo_accounts: MockAccount[];
  login: (email: string, password: string) => OperationResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => get_stored_session());

  const value: AuthContextValue = {
    session,
    demo_accounts: get_demo_accounts(),
    login: (email, password) => {
      const result = login_with_mock(email, password);

      if (!result.ok || !result.session) {
        return result;
      }

      setSession(result.session);
      return { ok: true, message: result.message };
    },
    logout: () => {
      logout_user();
      setSession(null);
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
