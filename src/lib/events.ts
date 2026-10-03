import { Code2, Music, Presentation, Users, Wine, type LucideIcon } from 'lucide-react';
import type { Category, City, EventItem, StandardCode, User } from '../types';
import { ageFrom, isUpcoming, startsAt } from './dates';

export const CATEGORY: Record<Category, { label: string; chip: string; color: string; Icon: LucideIcon }> = {
  workshop: { label: 'Workshop', chip: 'Workshops', color: '#2563EB', Icon: Presentation },
  hackathon: { label: 'Hackathon', chip: 'Hackathons', color: '#7C3AED', Icon: Code2 },
  networking: { label: 'Networking & drinks', chip: 'Networking', color: '#D97706', Icon: Wine },
  music: { label: 'Music', chip: 'Music', color: '#DB2777', Icon: Music },
  hangout: { label: 'Hangout', chip: 'Hangouts', color: '#0D9488', Icon: Users },
};

export const CATEGORIES = Object.keys(CATEGORY) as Category[];

export const CITY_CENTRE: Record<City, [number, number]> = {
  London: [51.5074, -0.1278],
  Manchester: [53.4808, -2.2426],
};
export const CITIES: City[] = ['London', 'Manchester'];

/**
 * Rules 1 + 2: an event only counts towards OTJ when it runs in working hours and builds KSBs.
 * Drives the green badge, OTJ hours, OTJ log entries and KSB evidence.
 */
export function countsForOtj(e: EventItem): boolean {
  return e.inWorkingHours && e.ksbs.length > 0;
}

export function isUnder18(user: User | null | undefined, now = new Date()): boolean {
  return !!user && ageFrom(user.dob, now) < 18;
}

/** Rule 3: under-18s never see 18+ events, anywhere. */
export function visibleTo(e: EventItem, user: User | null | undefined, now = new Date()): boolean {
  return !(e.ageRestricted18 && isUnder18(user, now));
}

export type TypeChip = 'ksbs' | Category;
export const TYPE_CHIPS: { id: TypeChip; label: string }[] = [
  { id: 'ksbs', label: 'KSBs' },
  ...CATEGORIES.map((c) => ({ id: c as TypeChip, label: CATEGORY[c].chip })),
];

export interface Filters {
  course: StandardCode;
  city: City;
  types: TypeChip[]; // none = all
}

export function hasKsbFor(e: EventItem, course: StandardCode): boolean {
  return e.ksbs.some((id) => id.startsWith(`${course}-`));
}

export function matchesFilters(e: EventItem, f: Filters): boolean {
  if (e.city !== f.city) return false;
  if (f.types.length === 0) return true;
  return f.types.some((t) => (t === 'ksbs' ? hasKsbFor(e, f.course) : e.category === t));
}

export const byStartAsc = (a: EventItem, b: EventItem) => startsAt(a).getTime() - startsAt(b).getTime();
export const byStartDesc = (a: EventItem, b: EventItem) => startsAt(b).getTime() - startsAt(a).getTime();

/** Upcoming first (soonest first), then past (most recent first). */
export function upcomingThenPast(events: EventItem[], now = new Date()): EventItem[] {
  const up = events.filter((e) => isUpcoming(e, now)).sort(byStartAsc);
  const past = events.filter((e) => !isUpcoming(e, now)).sort(byStartDesc);
  return [...up, ...past];
}
