import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { hostAuthorId, seedThread } from '../data/chatSeed';
import { EVENTS } from '../data/events';
import { ORGANISERS } from '../data/organisers';
import { peopleGoing } from '../data/people';
import { PERSONAS, SEED_FAVOURITES, SEED_RSVPS } from '../data/personas';
import { firstName, privacyOf, SYSTEM, unreadCount } from '../lib/chat';
import { computeProgress, type Progress } from '../lib/progress';
import { clearState, loadState, saveState } from '../lib/storage';
import type {
  Apprentice,
  AppState,
  Attendance,
  ChatMember,
  ChatMessage,
  EventItem,
  Organiser,
  PrivacySettings,
  User,
} from '../types';

const orgName = (id: string, extra: Organiser[] = []) => [...ORGANISERS, ...extra].find((o) => o.id === id)?.name ?? '';
const newId = (prefix: string) => `${prefix}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Seeded chat membership: personas are in the chats of events they RSVP'd to (auto-join is the
 * default) and hosts are in their organisation's chats. The last two seeded messages start unread.
 */
function seedChatMembers(rsvps: AppState['rsvps'], users: User[], events: EventItem[]): ChatMember[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const member = (userId: string, e: EventItem): ChatMember => {
    const thread = seedThread(e, orgName(e.organiserId));
    return {
      userId,
      eventId: e.id,
      joinedAt: thread[0]?.sentAt ?? new Date().toISOString(),
      lastReadAt: thread.length > 2 ? thread[thread.length - 3].sentAt : undefined,
    };
  };
  const out: ChatMember[] = [];
  for (const r of rsvps) {
    const u = users.find((x) => x.id === r.userId);
    const e = byId.get(r.eventId);
    if (u?.role === 'apprentice' && e) out.push(member(u.id, e));
  }
  for (const u of users) {
    if (u.role !== 'organiser') continue;
    for (const e of events) if (e.organiserId === u.organiserId) out.push(member(u.id, e));
  }
  return out;
}

export function seedState(currentUserId: string | null = null): AppState {
  const users = structuredClone(PERSONAS);
  const rsvps = [...SEED_RSVPS];
  return {
    currentUserId,
    users,
    rsvps,
    favourites: [...SEED_FAVOURITES],
    attendance: [],
    customEvents: [],
    customOrganisers: [],
    chatMembers: seedChatMembers(rsvps, users, EVENTS),
    messages: [],
    hiddenMessages: [],
  };
}

/** Fill in anything an older saved state is missing (e.g. saved before chat existed). */
function hydrate(raw: Partial<AppState> & Pick<AppState, 'users'>): AppState {
  const users = raw.users.map((u) => {
    const seed = PERSONAS.find((p) => p.id === u.id);
    return u.role === 'apprentice' && !u.employer && seed?.role === 'apprentice' ? { ...u, employer: seed.employer } : u;
  });
  const rsvps = raw.rsvps ?? [];
  const customEvents = raw.customEvents ?? [];
  return {
    currentUserId: raw.currentUserId ?? null,
    users,
    rsvps,
    favourites: raw.favourites ?? [],
    attendance: raw.attendance ?? [],
    customEvents,
    customOrganisers: raw.customOrganisers ?? [],
    chatMembers: raw.chatMembers ?? seedChatMembers(rsvps, users, [...EVENTS, ...customEvents]),
    messages: raw.messages ?? [],
    hiddenMessages: raw.hiddenMessages ?? [],
  };
}

/** Seeded goingCount plus RSVPs made in this browser (seeded persona RSVPs are already in goingCount). */
export function goingTotal(e: EventItem, rsvps: AppState['rsvps']): number {
  const extra = rsvps.filter(
    (r) => r.eventId === e.id && !SEED_RSVPS.some((s) => s.userId === r.userId && s.eventId === r.eventId),
  ).length;
  return e.goingCount + extra;
}

const isMember = (s: AppState, userId: string, eventId: string) =>
  s.chatMembers.some((m) => m.userId === userId && m.eventId === eventId);

function systemMessage(eventId: string, text: string): ChatMessage {
  return { id: newId('m'), eventId, authorId: SYSTEM, text, sentAt: new Date().toISOString() };
}

function joinChat(s: AppState, userId: string, eventId: string): AppState {
  if (isMember(s, userId, eventId)) return s;
  const user = s.users.find((u) => u.id === userId);
  const now = new Date().toISOString();
  return {
    ...s,
    chatMembers: [...s.chatMembers, { userId, eventId, joinedAt: now, lastReadAt: now }],
    messages: [...s.messages, systemMessage(eventId, `${firstName(user?.name ?? 'Someone')} joined the chat`)],
  };
}

function leaveChat(s: AppState, userId: string, eventId: string): AppState {
  if (!isMember(s, userId, eventId)) return s;
  const user = s.users.find((u) => u.id === userId);
  return {
    ...s,
    chatMembers: s.chatMembers.filter((m) => !(m.userId === userId && m.eventId === eventId)),
    messages: [...s.messages, systemMessage(eventId, `${firstName(user?.name ?? 'Someone')} left the chat`)],
  };
}

const updateMember = (s: AppState, userId: string, eventId: string, patch: (m: ChatMember) => ChatMember): AppState => ({
  ...s,
  chatMembers: s.chatMembers.map((m) => (m.userId === userId && m.eventId === eventId ? patch(m) : m)),
});

type Action =
  | { type: 'login'; userId: string }
  | { type: 'logout' }
  | { type: 'addUser'; user: User; organiser?: Organiser }
  | { type: 'updateUser'; user: User }
  | { type: 'toggleRsvp'; eventId: string; joinChat?: boolean }
  | { type: 'toggleFavourite'; eventId: string }
  | { type: 'saveAttendance'; attendance: Attendance }
  | { type: 'toggleSignedOff'; ksbId: string }
  | { type: 'addEvent'; event: EventItem }
  | { type: 'joinChat'; eventId: string }
  | { type: 'leaveChat'; eventId: string }
  | { type: 'postMessage'; eventId: string; text: string; authorId?: string }
  | { type: 'markRead'; eventId: string }
  | { type: 'toggleMute'; eventId: string }
  | { type: 'reportMessage'; messageId: string }
  | { type: 'updatePrivacy'; privacy: PrivacySettings }
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
    case 'toggleRsvp': {
      if (!uid) return state;
      const { eventId } = action;
      const going = state.rsvps.some((r) => r.userId === uid && r.eventId === eventId);
      const next = { ...state, rsvps: toggle(state.rsvps, { userId: uid, eventId }) };
      if (!going) return action.joinChat ? joinChat(next, uid, eventId) : next;
      return leaveChat(next, uid, eventId); // cancelling an RSVP leaves the chat
    }
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
    case 'addEvent': {
      const next = { ...state, customEvents: [...state.customEvents, action.event] };
      if (!uid) return next;
      const now = new Date().toISOString();
      // The host is in their event's chat from the start.
      return { ...next, chatMembers: [...next.chatMembers, { userId: uid, eventId: action.event.id, joinedAt: now, lastReadAt: now }] };
    }
    case 'joinChat':
      return uid ? joinChat(state, uid, action.eventId) : state;
    case 'leaveChat':
      return uid ? leaveChat(state, uid, action.eventId) : state;
    case 'postMessage': {
      const authorId = action.authorId ?? uid;
      const text = action.text.trim();
      if (!authorId || !text) return state;
      const msg: ChatMessage = { id: newId('m'), eventId: action.eventId, authorId, text, sentAt: new Date().toISOString() };
      const next = { ...state, messages: [...state.messages, msg] };
      return authorId === uid ? updateMember(next, uid, action.eventId, (m) => ({ ...m, lastReadAt: msg.sentAt })) : next;
    }
    case 'markRead':
      if (!uid) return state;
      return updateMember(state, uid, action.eventId, (m) => ({ ...m, lastReadAt: new Date().toISOString() }));
    case 'toggleMute':
      if (!uid) return state;
      return updateMember(state, uid, action.eventId, (m) => ({ ...m, muted: !m.muted }));
    case 'reportMessage':
      if (!uid) return state;
      return { ...state, hiddenMessages: [...state.hiddenMessages, { userId: uid, messageId: action.messageId }] };
    case 'updatePrivacy':
      return { ...state, users: state.users.map((u) => (u.id === uid ? { ...u, privacy: action.privacy } : u)) };
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
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = loadState();
    return saved ? hydrate(saved) : seedState();
  });
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

/** Everything needed to resolve author names with the privacy rules applied. */
export function useDirectory() {
  const { state } = useApp();
  const organisers = useOrganisers();
  return useMemo(() => ({ users: state.users, organisers, meId: state.currentUserId }), [state.users, organisers, state.currentUserId]);
}

/** Seeded history + messages posted in this browser, minus anything the current user reported. */
export function useThreadBuilder() {
  const { state } = useApp();
  const organisers = useOrganisers();
  return useCallback(
    (e: EventItem): ChatMessage[] => {
      const hidden = new Set(state.hiddenMessages.filter((h) => h.userId === state.currentUserId).map((h) => h.messageId));
      return [...seedThread(e, orgName(e.organiserId, organisers)), ...state.messages.filter((m) => m.eventId === e.id)]
        .filter((m) => !hidden.has(m.id))
        .sort((a, b) => (a.sentAt < b.sentAt ? -1 : a.sentAt > b.sentAt ? 1 : 0));
    },
    [state.messages, state.hiddenMessages, state.currentUserId, organisers],
  );
}

export interface ChatSummary {
  event: EventItem;
  member: ChatMember;
  thread: ChatMessage[];
  unread: number;
  last?: ChatMessage;
}

/** The current user's chats, most recent activity first. */
export function useChatSummaries(): ChatSummary[] {
  const { state } = useApp();
  const byId = useEventsById();
  const build = useThreadBuilder();
  return useMemo(() => {
    const uid = state.currentUserId;
    if (!uid) return [];
    return state.chatMembers
      .filter((m) => m.userId === uid && byId.has(m.eventId))
      .map((member) => {
        const event = byId.get(member.eventId)!;
        const thread = build(event);
        return { event, member, thread, unread: unreadCount(thread, member, uid), last: thread[thread.length - 1] };
      })
      .sort((a, b) => ((b.last?.sentAt ?? b.member.joinedAt) > (a.last?.sentAt ?? a.member.joinedAt) ? 1 : -1));
  }, [state.chatMembers, state.currentUserId, byId, build]);
}

export function useUnreadTotal(): number {
  return useChatSummaries().reduce((n, c) => n + c.unread, 0);
}

/** RSVP / join / leave with toasts, plus a friendly simulated welcome from someone already in the chat. */
export function useChatActions() {
  const { state, dispatch, toast } = useApp();
  const user = useCurrentUser();

  const welcome = useCallback(
    (e: EventItem) => {
      if (!user || user.role !== 'apprentice') return;
      const people = peopleGoing(e);
      const greeter = people[1] ?? people[0];
      const name = firstName(user.name);
      window.setTimeout(() => {
        dispatch({
          type: 'postMessage',
          eventId: e.id,
          authorId: greeter ? greeter.id : hostAuthorId(e.organiserId),
          text: greeter ? `Welcome ${name}! 👋` : `Welcome ${name}, thanks for signing up! 🙌`,
        });
      }, 2500);
    },
    [user, dispatch],
  );

  const rsvp = useCallback(
    (e: EventItem, join: boolean) => {
      const going = state.rsvps.some((r) => r.userId === state.currentUserId && r.eventId === e.id);
      dispatch({ type: 'toggleRsvp', eventId: e.id, joinChat: join });
      if (going) {
        toast('RSVP cancelled');
      } else if (join) {
        toast("You're going · added to the group chat");
        welcome(e);
      } else {
        toast("You're going");
      }
    },
    [state.rsvps, state.currentUserId, dispatch, toast, welcome],
  );

  const join = useCallback(
    (e: EventItem) => {
      dispatch({ type: 'joinChat', eventId: e.id });
      toast('Added to the group chat');
      welcome(e);
    },
    [dispatch, toast, welcome],
  );

  const leave = useCallback(
    (e: EventItem) => {
      dispatch({ type: 'leaveChat', eventId: e.id });
      toast('You left the chat');
    },
    [dispatch, toast],
  );

  const autoJoinDefault = user ? privacyOf(user).autoJoinChats : true;
  return { rsvp, join, leave, autoJoinDefault };
}
