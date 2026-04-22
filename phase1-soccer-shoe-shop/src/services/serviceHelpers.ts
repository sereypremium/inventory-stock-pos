import type { InventoryState, StateOperationResult } from '../types/models';

export function create_timestamps(at = new Date().toISOString()) {
  return {
    created_at: at,
    updated_at: at,
  };
}

export function build_success(message: string, state: InventoryState, record_id?: string) {
  return { ok: true, message, state, record_id } satisfies StateOperationResult;
}

export function build_failure(message: string) {
  return { ok: false, message } satisfies StateOperationResult;
}

export function next_reference_number(values: string[], prefix: string) {
  const max_number = values.reduce((max_value, value) => {
    const match = value.match(/(\d+)$/);
    const parsed = match ? Number(match[1]) : 0;

    return Math.max(max_value, parsed);
  }, 0);

  return `${prefix}-${String(max_number + 1).padStart(4, '0')}`;
}
