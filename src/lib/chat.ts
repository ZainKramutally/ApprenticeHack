import { addDays } from 'date-fns';
import { getPerson, peopleGoing } from '../data/people';
import { getStandard } from '../data/standards';
import type { ChatMember, ChatMessage, EventItem, GoingVisibility, Organiser, PrivacySettings, User } from '../types';
import { endsAt } from './dates';

export const DEFAULT_PRIVACY: PrivacySettings = { autoJoinChats: true, showGoing: 'everyone', showEmployer: true };

export const privacyOf = (u: User): PrivacySettings => ({ ...DEFAULT_PRIVACY, ...u.privacy });

export const SYSTEM = 'system';

/** Privacy rule: other people only ever see first name + last initial. */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  return last ? `${parts[0]} ${last[0]}.` : parts[0];
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0];

const AVATAR_COLOURS = ['#2563EB', '#7C3AED', '#D97706', '#DB2777', '#0D9488', '#16A34A', '#DC2626', '#4F46E5'];
export function avatarColour(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[h % AVATAR_COLOURS.length];
}

export interface Author {
  id: string;
  name: string; // already privacy-safe
  detail: string; // "DTSP · Brightwire Software"; for hosts, 'Host' (organisation) or the organisation name (organiser user)
  host: boolean;
  me: boolean;
}

interface Directory {
  users: User[];
  organisers: Organiser[];
  meId: string | null;
}

/** Who wrote a message (or appears in a list), with the privacy display rules applied. */
export function resolveAuthor(authorId: string, dir: Directory): Author {
  const me = authorId === dir.meId;
  if (authorId.startsWith('host:')) {
    const org = dir.organisers.find((o) => o.id === authorId.slice(5));
    return { id: authorId, name: org?.name ?? 'Host', detail: 'Host', host: true, me: false };
  }
  const person = getPerson(authorId);
  if (person) {
    const detail = [getStandard(person.standardCode).shortName, person.showEmployer ? person.employer : null];
    return { id: authorId, name: shortName(person.name), detail: detail.filter(Boolean).join(' · '), host: false, me };
  }
  const user = dir.users.find((u) => u.id === authorId);
  if (user?.role === 'apprentice') {
    const detail = [getStandard(user.standardCode).shortName, privacyOf(user).showEmployer ? user.employer : null];
    return { id: authorId, name: shortName(user.name), detail: detail.filter(Boolean).join(' · '), host: false, me };
  }
  if (user?.role === 'organiser') {
    const org = dir.organisers.find((o) => o.id === user.organiserId);
    return { id: authorId, name: shortName(user.name), detail: org?.name ?? '', host: true, me };
  }
  return { id: authorId, name: 'Apprentice', detail: '', host: false, me };
}

/** Chats stay open for a week after the event so people can keep in touch, then go read-only. */
export function isReadOnly(e: EventItem, now = new Date()): boolean {
  return addDays(endsAt(e), 7) < now;
}

export function unreadCount(thread: ChatMessage[], member: ChatMember | undefined, meId: string): number {
  if (!member || member.muted) return 0;
  return thread.filter(
    (m) => m.authorId !== SYSTEM && m.authorId !== meId && (!member.lastReadAt || m.sentAt > member.lastReadAt),
  ).length;
}

/** Can `viewer` see someone with this "who can see I'm going" setting? */
export function canSeeGoing(setting: GoingVisibility, ownerStandard: string, viewer: User): boolean {
  if (setting === 'everyone') return true;
  if (setting === 'coursemates') return viewer.role === 'apprentice' && viewer.standardCode === ownerStandard;
  return false;
}

export interface Attendee {
  id: string;
  name: string;
  detail: string;
  me: boolean;
}

/** "Who's going" for an event, as `viewer` is allowed to see it. Counts stay honest; names respect privacy. */
export function visibleAttendees(
  e: EventItem,
  rsvpUserIds: string[],
  viewer: User,
  dir: Directory,
): { shown: Attendee[]; meHidden: boolean } {
  const shown: Attendee[] = [];
  let meHidden = false;
  for (const uid of rsvpUserIds) {
    const u = dir.users.find((x) => x.id === uid);
    if (!u || u.role !== 'apprentice') continue;
    const a = resolveAuthor(uid, dir);
    if (uid === viewer.id) {
      if (privacyOf(u).showGoing === 'nobody') meHidden = true;
      shown.unshift({ ...a, name: 'You' });
    } else if (canSeeGoing(privacyOf(u).showGoing, u.standardCode, viewer)) {
      shown.push(a);
    }
  }
  for (const p of peopleGoing(e)) {
    if (canSeeGoing(p.showGoing, p.standardCode, viewer)) shown.push(resolveAuthor(p.id, dir));
  }
  return { shown, meHidden };
}
