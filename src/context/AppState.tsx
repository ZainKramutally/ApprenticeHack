import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { EVENTS } from '../data/events';
import { ORGANISERS } from '../data/organisers';
import { PERSONAS, SEED_FAVOURITES, SEED_RSVPS } from '../data/personas';
import { computeProgress, type Progress } from '../lib/progress';
import { clearState, loadState, saveState } from '../lib/storage';
import type { Apprentice, AppState, Attendance, EventItem, Organiser, User } from '../types';

export function seedState(currentUserId: string | null = null): AppState {
  return {
    currentUserId,
    users: structuredClone(PERSONAS),
    rsvps: [...SEED_RSVPS],
    favourites: [...SEED_FAVOURITES],
    attendance: [],
    customEvents: [],
    customOrganisers: [],
  };
}

type Action =
  | { type: 'login'; userId: string }
  | { type: 'logout' }
  | { type: 'addUser'; user: User; organiser?: Organiser }
  | { type: 'updateUser'; user: User }
  | { type: 'toggleRsvp'; eventId: string }
  | { type: 'toggleFavourite'; eventId: string }
  | { type: 'saveAttendance'; attendance: Attendance }
  | { type: 'toggleSignedOff'; ksbId: string }
  | { type: 'addEvent'; event: EventItem }
  | { type: 'reset' };

type Pair = { userId: string; eventId: string };
const toggle = (list: Pair[], p: Pair) =>
  list.some((x) => x.userId === p.userId && x.eventId === p.eventId)
    ? list.filter((x) => !(x.userId === p.userId && x.eventId === p.eventId))
    : [...list, p];

function reducer(state: AppState, action: Action): AppState {
  const uid = state.currentUserId;
  switch (action.type) {
    case 'login': {
      if (state.users.some((u) => u.id === action.userId)) return { ...state, currentUserId: action.userId };
      const persona = PERSONAS.find((p) => p.id === action.userId);
      if (!persona) return state;
      return { ...state, users: [...state.users, structuredClone(persona)], currentUserId: persona.id };
    }
    case 'logout':
      return { ...state, currentUserId: null };
    case 'addUser':
      return {
        ...state,
        users: [...state.users.filter((u) => u.id !== action.user.id), action.user],
        customOrganisers: action.organiser ? [...state.customOrganisers, action.organiser] : state.customOrganisers,
        currentUserId: action.user.id,
      };
    case 'updateUser':
      return { ...state, users: state.users.map((u) => (u.id === action.user.id ? action.user : u)) };
    case 'toggleRsvp':
      if (!uid) return state;
      return { ...state, rsvps: toggle(state.rsvps, { userId: uid, eventId: action.eventId }) };
    case 'toggleFavourite':
      if (!uid) return state;
      return { ...state, favourites: toggle(state.favourites, { userId: uid, eventId: action.eventId }) };
    case 'saveAttendance': {
      const a = action.attendance;
      const rest = state.attendance.filter((x) => !(x.userId === a.userId && x.eventId === a.eventId));
      return { ...state, attendance: [...rest, a] };
    }
    case 'toggleSignedOff':
      return {
        ...state,
        users: state.users.map((u) => {
          if (u.id !== uid || u.role !== 'apprentice') return u;
          const signedOff = u.signedOff.includes(action.ksbId)
            ? u.signedOff.filter((id) => id !== action.ksbId)
            : [...u.signedOff, action.ksbId];
          return { ...u, signedOff };
        }),
      };
    case 'addEvent':
      return { ...state, customEvents: [...state.customEvents, action.event] };
    case 'reset':
      // Keep the presenter signed in as the same persona if it exists in the seed.
      return seedState(PERSONAS.some((p) => p.id === uid) ? uid : null);
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  toast: (message: string) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? seedState());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const wrappedDispatch = useCallback((a: Action) => {
    if (a.type === 'reset') clearState();
    dispatch(a);
  }, []);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const value = useMemo(() => ({ state, dispatch: wrappedDispatch, toast }), [state, wrappedDispatch, toast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[2000] flex justify-center px-4 md:bottom-8 print:hidden"
      >
        {toastMsg && (
          <div className="toast-in rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg">{toastMsg}</div>
        )}
      </div>
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useCurrentUser(): User | null {
  const { state } = useApp();
  return useMemo(() => state.users.find((u) => u.id === state.currentUserId) ?? null, [state.users, state.currentUserId]);
}

export function useApprentice(): Apprentice | null {
  const u = useCurrentUser();
  return u?.role === 'apprentice' ? u : null;
}

export function useAllEvents(): EventItem[] {
  const { state } = useApp();
  return useMemo(() => [...EVENTS, ...state.customEvents], [state.customEvents]);
}

export function useEventsById(): Map<string, EventItem> {
  const events = useAllEvents();
  return useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
}

export function useOrganisers(): Organiser[] {
  const { state } = useApp();
  return useMemo(() => [...ORGANISERS, ...state.customOrganisers], [state.customOrganisers]);
}

export function useOrganiser(id: string | undefined): Organiser | undefined {
  const orgs = useOrganisers();
  return orgs.find((o) => o.id === id);
}

export function useProgress(): Progress | null {
  const { state } = useApp();
  const user = useApprentice();
  const byId = useEventsById();
  return useMemo(() => (user ? computeProgress(user, state.attendance, byId) : null), [user, state.attendance, byId]);
}

/** RSVP / favourite / attendance lookups for the current user. */
export function useMyEventState() {
  const { state } = useApp();
  const uid = state.currentUserId;
  return useMemo(() => {
    const rsvp = new Set(state.rsvps.filter((r) => r.userId === uid).map((r) => r.eventId));
    const fav = new Set(state.favourites.filter((r) => r.userId === uid).map((r) => r.eventId));
    const attended = new Map(state.attendance.filter((a) => a.userId === uid).map((a) => [a.eventId, a]));
    return { rsvp, fav, attended };
  }, [state.rsvps, state.favourites, state.attendance, uid]);
}
