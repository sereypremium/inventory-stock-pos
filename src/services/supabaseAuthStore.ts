import { supabase } from '../lib/supabase';
import type {
  AppUser,
  OperationResult,
  SystemSettings,
} from '../types/models';

interface AppUserRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  password: string;
  role: AppUser['role'];
  status: AppUser['status'];
}

interface SystemSettingsRow {
  id: string;
  created_at: string;
  updated_at: string;
  store_name: string;
  branch_name: string;
  address: string;
  phone: string;
  receipt_footer: string;
  report_footer: string;
}

interface RemoteEntityResult<T> extends OperationResult {
  record?: T;
}

const SETTINGS_ROW_ID = 'store-profile';
const emptySystemSettings: SystemSettings = {
  storeName: '',
  branchName: '',
  address: '',
  phone: '',
  receiptFooter: '',
  reportFooter: '',
};

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

function mapUserRowToModel(row: AppUserRow): AppUser {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    status: row.status,
  };
}

function mapUserToRow(user: AppUser): AppUserRow {
  return {
    id: user.id,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    status: user.status,
  };
}

function mapSettingsRowToModel(row: SystemSettingsRow | null | undefined): SystemSettings {
  if (!row) {
    return emptySystemSettings;
  }

  return {
    storeName: row.store_name ?? emptySystemSettings.storeName,
    branchName: row.branch_name ?? emptySystemSettings.branchName,
    address: row.address ?? emptySystemSettings.address,
    phone: row.phone ?? emptySystemSettings.phone,
    receiptFooter: row.receipt_footer ?? emptySystemSettings.receiptFooter,
    reportFooter: row.report_footer ?? emptySystemSettings.reportFooter,
  };
}

function mapSettingsToRow(settings: SystemSettings): SystemSettingsRow {
  const timestamp = new Date().toISOString();

  return {
    id: SETTINGS_ROW_ID,
    created_at: timestamp,
    updated_at: timestamp,
    store_name: settings.storeName.trim(),
    branch_name: settings.branchName.trim(),
    address: settings.address.trim(),
    phone: settings.phone.trim(),
    receipt_footer: settings.receiptFooter.trim(),
    report_footer: settings.reportFooter.trim(),
  };
}

export async function fetchSupabaseAuthStore(): Promise<{
  users: AppUser[];
  settings: SystemSettings;
}> {
  const client = getClient();
  const [usersResult, settingsResult] = await Promise.all([
    client.from('app_users').select('*').order('created_at', { ascending: false }),
    client.from('system_settings').select('*').eq('id', SETTINGS_ROW_ID).maybeSingle(),
  ]);

  if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  return {
    users: ((usersResult.data ?? []) as AppUserRow[]).map(mapUserRowToModel),
    settings: mapSettingsRowToModel(settingsResult.data as SystemSettingsRow | null),
  };
}

export async function saveSupabaseUser(user: AppUser): Promise<RemoteEntityResult<AppUser>> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('app_users')
      .upsert(mapUserToRow(user))
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save the user to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'User saved successfully.',
      recordId: data.id,
      record: mapUserRowToModel(data as AppUserRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save the user to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function deleteSupabaseUser(userId: string): Promise<OperationResult> {
  try {
    const client = getClient();
    const { error } = await client.from('app_users').delete().eq('id', userId);

    if (error) {
      return buildRemoteFailure(`Could not delete the user from Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'User deleted successfully.',
      recordId: userId,
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not delete the user from Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}

export async function saveSupabaseSettings(
  settings: SystemSettings,
): Promise<RemoteEntityResult<SystemSettings>> {
  try {
    const client = getClient();
    const row = mapSettingsToRow(settings);
    const { data: existingRow } = await client
      .from('system_settings')
      .select('created_at')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (existingRow?.created_at) {
      row.created_at = existingRow.created_at;
    }

    const { data, error } = await client
      .from('system_settings')
      .upsert(row)
      .select()
      .single();

    if (error) {
      return buildRemoteFailure(`Could not save settings to Supabase: ${error.message}`);
    }

    return {
      ok: true,
      message: 'Settings saved successfully.',
      record: mapSettingsRowToModel(data as SystemSettingsRow),
    };
  } catch (error) {
    return buildRemoteFailure(
      `Could not save settings to Supabase: ${error instanceof Error ? error.message : 'Unknown error.'}`,
    );
  }
}
