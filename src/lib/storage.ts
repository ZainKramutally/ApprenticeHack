import type { AppState } from '../types';

export const STORAGE_KEY = 'otc:v1';

/** Raw saved state, or null if missing/unparsable. AppState fills defaults for anything missing. */
export function loadState(): (Partial<AppState> & Pick<AppState, 'users'>) | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.users)) return null;
    return parsed as Partial<AppState> & Pick<AppState, 'users'>;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): the demo keeps working in memory.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
