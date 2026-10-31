import type { AppState, Role } from '../domain/types';
import { buildSeedState } from './seed';

export const STORAGE_KEY = 'appie-demo-state-v2';
export const LEGACY_STORAGE_KEYS = ['appie-demo-state-v1'] as const;
export type PersistenceNotice = 'none' | 'reset_corrupt' | 'storage_unavailable';

let persistenceAvailable = true;
let saveWarningShown = false;
const roles: readonly Role[] = ['patient', 'doctor', 'pharmacist', 'ops'];

const isState = (value: unknown): value is AppState => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AppState>;
  return candidate.schemaVersion === 2 && Array.isArray(candidate.episodes) && Array.isArray(candidate.audit) && typeof candidate.operator === 'object' && candidate.operator !== null && (candidate.role === null || (typeof candidate.role === 'string' && roles.includes(candidate.role as Role)));
};

export const loadState = (): { state: AppState; notice: PersistenceNotice } => {
  try {
    for (const legacy of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(legacy);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { state: buildSeedState(), notice: 'none' };
    const parsed: unknown = JSON.parse(stored);
    if (isState(parsed)) return { state: parsed, notice: 'none' };
    console.warn('[appie] stored demo state unreadable, reseeding');
    return { state: buildSeedState(), notice: 'reset_corrupt' };
  } catch {
    try {
      window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return { state: buildSeedState(), notice: 'storage_unavailable' };
    }
    console.warn('[appie] stored demo state unreadable, reseeding');
    return { state: buildSeedState(), notice: 'reset_corrupt' };
  }
};

export const saveState = (state: AppState): boolean => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    persistenceAvailable = true;
    return true;
  } catch {
    persistenceAvailable = false;
    if (!saveWarningShown) {
      console.warn('[appie] demo progress could not be saved');
      saveWarningShown = true;
    }
    return false;
  }
};

export const clearState = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
};

export const isPersistenceAvailable = (): boolean => persistenceAvailable;
