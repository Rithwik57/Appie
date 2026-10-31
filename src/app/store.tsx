import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { clearState, loadState, saveState, STORAGE_KEY } from '../data/persistence';
import type { AppState } from '../domain/types';
import type { Action, TransitionResult } from './actions';
import { applyAction } from './stateMachine';

interface AppStore { getState(): AppState; subscribe(listener: () => void): () => void; dispatch(action: Action): TransitionResult; reset(): TransitionResult; }
export const createStore = (initial = loadState().state): AppStore => {
  let state = initial; const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') window.addEventListener('storage', (event) => { if (event.key !== STORAGE_KEY || event.newValue === null) return; try { const parsed: unknown = JSON.parse(event.newValue); if (typeof parsed === 'object' && parsed !== null && (parsed as AppState).schemaVersion === 2 && Array.isArray((parsed as AppState).episodes)) { state = { ...(parsed as AppState), role: state.role }; notify(); } } catch { console.warn('[appie] ignored unreadable cross-tab demo state'); } });
  return { getState: () => state, subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); }, dispatch: (action) => { const result = applyAction(state, action); if (result.ok) { state = result.state; saveState(state); notify(); } else if (import.meta.env.DEV) console.warn('[appie] rejected', action.type, result.error.code); return result; }, reset: () => { clearState(); const result = applyAction(state, { type: 'RESET_DEMO' }); if (result.ok) { state = result.state; saveState(state); notify(); } return result; } };
};
const StoreContext = createContext<AppStore | null>(null);
export const StoreProvider = ({ children }: { children: ReactNode }) => { const store = useMemo(() => createStore(), []); return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>; };
const useStore = () => { const store = useContext(StoreContext); if (store === null) throw new Error('StoreProvider is required.'); return store; };
export const useAppState = () => { const store = useStore(); return useSyncExternalStore(store.subscribe, store.getState, store.getState); };
export const useDispatch = () => useStore().dispatch;
