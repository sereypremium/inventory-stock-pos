import type {
  InventoryState,
  MockAccount,
  ShopSettingsInput,
  StateOperationResult,
  UserInput,
} from '../types/models';
import { build_failure, build_success, create_timestamps } from './serviceHelpers';

function validate_user_input(
  state: InventoryState,
  input: UserInput,
  user_id?: string,
) {
  if (!input.full_name.trim()) {
    return 'Full name is required.';
  }

  if (!input.email.trim()) {
    return 'Email is required.';
  }

  if (!input.password.trim()) {
    return 'Password is required.';
  }

  const duplicate_email = state.profiles.some(
    (profile) =>
      profile.id !== user_id && profile.email.toLowerCase() === input.email.trim().toLowerCase(),
  );

  if (duplicate_email) {
    return 'Email must be unique.';
  }

  return null;
}

export function update_shop_settings(
  state: InventoryState,
  input: ShopSettingsInput,
): StateOperationResult {
  if (!input.shop_name.trim()) {
    return build_failure('Shop name is required.');
  }

  return build_success('Shop settings updated successfully.', {
    ...state,
    settings: {
      ...state.settings,
      shop_name: input.shop_name.trim(),
      shop_logo_url: input.shop_logo_url.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      currency: input.currency.trim() || 'USD',
      receipt_footer: input.receipt_footer.trim(),
      theme_color: input.theme_color.trim() || '#0f5b4f',
      updated_at: new Date().toISOString(),
    },
  });
}

export function create_user_profile(
  state: InventoryState,
  input: UserInput,
): StateOperationResult {
  const validation_message = validate_user_input(state, input);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const next_profile: MockAccount = {
    id: crypto.randomUUID(),
    ...create_timestamps(),
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
    status: input.status,
  };

  return build_success(
    'User saved successfully.',
    { ...state, profiles: [next_profile, ...state.profiles] },
    next_profile.id,
  );
}

export function update_user_profile(
  state: InventoryState,
  user_id: string,
  input: UserInput,
): StateOperationResult {
  const validation_message = validate_user_input(state, input, user_id);

  if (validation_message) {
    return build_failure(validation_message);
  }

  const target = state.profiles.find((profile) => profile.id === user_id);

  if (!target) {
    return build_failure('User not found.');
  }

  const active_admin_count = state.profiles.filter(
    (profile) => profile.role === 'admin' && profile.status === 'active',
  ).length;

  if (
    target.role === 'admin' &&
    target.status === 'active' &&
    input.role !== 'admin' &&
    active_admin_count <= 1
  ) {
    return build_failure('At least one active admin user is required.');
  }

  if (
    target.role === 'admin' &&
    target.status === 'active' &&
    input.status !== 'active' &&
    active_admin_count <= 1
  ) {
    return build_failure('At least one active admin user is required.');
  }

  return build_success('User updated successfully.', {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === user_id
        ? {
            ...profile,
            full_name: input.full_name.trim(),
            email: input.email.trim().toLowerCase(),
            password: input.password,
            role: input.role,
            status: input.status,
            updated_at: new Date().toISOString(),
          }
        : profile,
    ),
  });
}

export function delete_user_profile(
  state: InventoryState,
  user_id: string,
): StateOperationResult {
  const target = state.profiles.find((profile) => profile.id === user_id);

  if (!target) {
    return build_failure('User not found.');
  }

  const has_history =
    state.purchase_headers.some((purchase) => purchase.created_by === user_id) ||
    state.sale_headers.some((sale) => sale.created_by === user_id);

  if (has_history) {
    return build_failure(
      'This user already has transaction history. Deactivate it instead of deleting.',
    );
  }

  const active_admin_count = state.profiles.filter(
    (profile) => profile.role === 'admin' && profile.status === 'active',
  ).length;

  if (target.role === 'admin' && target.status === 'active' && active_admin_count <= 1) {
    return build_failure('At least one active admin user is required.');
  }

  return build_success('User deleted successfully.', {
    ...state,
    profiles: state.profiles.filter((profile) => profile.id !== user_id),
  });
}
