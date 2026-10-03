import type { AppState } from '../types';

export const STORAGE_KEY = 'otc:v1';

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.users)) return null;
    return {
      currentUserId: parsed.currentUserId ?? null,
      users: parsed.users,
      rsvps: parsed.rsvps ?? [],
      favourites: parsed.favourites ?? [],
      attendance: parsed.attendance ?? [],
      customEvents: parsed.customEvents ?? [],
      customOrganisers: parsed.customOrganisers ?? [],
    };
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
