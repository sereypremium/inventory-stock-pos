import { load_catalog_state } from './catalogStore';
import type { MockAccount, OperationResult, UserSession } from '../types/models';

const AUTH_STORAGE_KEY = 'soccer-shoe-shop-pos.auth-session';

function get_accounts_from_store() {
  return load_catalog_state().profiles;
}

function build_session(account: MockAccount): UserSession {
  return {
    id: account.id,
    full_name: account.full_name,
    email: account.email,
    role: account.role,
  };
}

export function get_demo_accounts() {
  return get_accounts_from_store().filter((account) => account.status === 'active');
}

export function get_stored_session() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored_value = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!stored_value) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored_value) as UserSession;
    const match = get_accounts_from_store().find(
      (account) => account.id === parsed.id && account.status === 'active',
    );

    if (!match) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return build_session(match);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function login_with_mock(
  email: string,
  password: string,
): OperationResult & { session?: UserSession } {
  const match = get_accounts_from_store().find(
    (account) =>
      account.status === 'active' &&
      account.email.toLowerCase() === email.trim().toLowerCase() &&
      account.password === password,
  );

  if (!match) {
    return {
      ok: false,
      message: 'Invalid credentials. Use one of the demo accounts shown on the page.',
    };
  }

  const session = build_session(match);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

  return {
    ok: true,
    message: `Welcome back, ${match.full_name}.`,
    session,
  };
}

export function logout_user() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
