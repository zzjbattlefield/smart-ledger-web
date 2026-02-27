const USER_STORE_KEY = 'user-storage';
const LEGACY_AUTH_STORE_KEYS = ['smart-ledger-storage'];

interface JWTPayload {
  exp?: number;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function parseJWTPayload(token: string): JWTPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJSON = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJSON) as unknown;
    if (!payload || typeof payload !== 'object') return null;
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWTPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now();
}

export function getAuthToken(): string | null {
  // zustand persist 默认结构：{ state: { token, user }, version }
  const persisted = localStorage.getItem(USER_STORE_KEY);
  if (!persisted) return null;

  try {
    const parsed = JSON.parse(persisted) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      clearAuthStorage();
      return null;
    }

    const state = (parsed as { state?: unknown }).state;
    if (!state || typeof state !== 'object') {
      clearAuthStorage();
      return null;
    }

    const token = (state as { token?: unknown }).token;
    if (typeof token !== 'string' || token.length === 0) return null;

    if (isTokenExpired(token)) {
      clearAuthStorage();
      return null;
    }

    return token;
  } catch {
    clearAuthStorage();
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(USER_STORE_KEY);
  LEGACY_AUTH_STORE_KEYS.forEach((key) => localStorage.removeItem(key));
}
