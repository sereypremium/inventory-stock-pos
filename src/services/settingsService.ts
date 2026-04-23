import { supabase } from '../lib/supabase';
import type {
  OperationResult,
  SystemSettings,
} from '../types/models';

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

export const emptySystemSettings: SystemSettings = {
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

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const client = getClient();
  const { data, error } = await client
    .from('system_settings')
    .select('*')
    .eq('id', SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapSettingsRowToModel(data as SystemSettingsRow | null);
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
