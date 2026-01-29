const USER_STORE_KEY = 'user-storage';

export function getAuthToken(): string | null {
  // zustand persist 默认结构：{ state: { token, user }, version }
  const persisted = localStorage.getItem(USER_STORE_KEY);
  if (!persisted) return null;

  try {
    const parsed = JSON.parse(persisted) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const state = (parsed as { state?: unknown }).state;
    if (!state || typeof state !== 'object') return null;

    const token = (state as { token?: unknown }).token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(USER_STORE_KEY);
}
