import { supabase } from '../lib/supabase';
import type {
  OperationResult,
  Role,
  UserProfile,
  UserProfileInput,
} from '../types/models';

interface ProfileRow {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  app_role: Role;
  status: UserProfile['status'];
}

interface RemoteEntityResult<T> extends OperationResult {
  record?: T;
}

const PROFILE_COLUMNS = 'id, created_at, updated_at, email, full_name, app_role, status';

function getClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function buildRemoteFailure(message: string): OperationResult {
  return {
    ok: false,
    message,
  };
}

function normalizeRole(value: string | null | undefined): Role {
  return value === 'admin' ? 'admin' : 'cashier';
}

function mapProfileRowToModel(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: row.email,
    fullName: row.full_name,
    appRole: normalizeRole(row.app_role),
    status: row.status === 'inactive' ? 'inactive' : 'active',
  };
}

function mapProfileInputToRow(input: UserProfileInput) {
  return {
    full_name: input.fullName.trim(),
    app_role: input.appRole,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const client = getClient();

  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    console.error('Could not get the current Supabase Auth user for profile lookup.', {
      message: authError?.message,
      status: authError?.status,
    });
    throw new Error(authError?.message || 'No authenticated Supabase user was returned.');
  }

  const userId = authData.user.id;
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Could not load the current profile from public.profiles.', {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === 'PGRST116') {
      return null;
    }

    throw new Error(error.message);
  }

  return data ? mapProfileRowToModel(data as ProfileRow) : null;
}

export async function fetchProfiles(): Promise<UserProfile[]> {
  const client = getClient();
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ProfileRow[]).map(mapProfileRowToModel);
}

export async function saveProfile(
  profileId: string,
  input: UserProfileInput,
): Promise<RemoteEntityResult<UserProfile>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .update(mapProfileInputToRow(input))
      .eq('id', profileId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the profile: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Profile saved successfully.',
      recordId: data.id,
      record: mapProfileRowToModel(data as ProfileRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the profile: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}
