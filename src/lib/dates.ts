import { addDays, addMinutes, differenceInCalendarDays, differenceInYears, format, parseISO, startOfToday } from 'date-fns';
import type { EventItem } from '../types';

/** Resolve an event to a real start time: startOfToday() + dayOffset days + HH:mm (or its absolute date). */
export function startsAt(e: EventItem): Date {
  const [h, m] = e.start.split(':').map(Number);
  const day = e.date ? parseISO(e.date) : addDays(startOfToday(), e.dayOffset);
  return addMinutes(day, h * 60 + m);
}

export function endsAt(e: EventItem): Date {
  return addMinutes(startsAt(e), Math.round(e.durationHours * 60));
}

export function isUpcoming(e: EventItem, now: Date = new Date()): boolean {
  return startsAt(e) > now;
}

export function ageFrom(dob: string, now: Date = new Date()): number {
  return differenceInYears(now, parseISO(dob));
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(iso), now);
}

/** "Thu 8 Oct · 10:00" */
export const fmtCard = (d: Date) => format(d, "EEE d MMM '·' HH:mm");
/** "27 Sep 2026" */
export const fmtLong = (d: Date) => format(d, 'd MMM yyyy');
/** "8 Oct" */
export const fmtShort = (d: Date) => format(d, 'd MMM');
/** "10:00" */
export const fmtTime = (d: Date) => format(d, 'HH:mm');
/** "Thu 8 Oct 2026 · 10:00–13:00" */
export const fmtRange = (e: EventItem) =>
  `${format(startsAt(e), 'EEE d MMM yyyy')} · ${fmtTime(startsAt(e))}–${fmtTime(endsAt(e))}`;
export const isoDay = (d: Date) => format(d, 'yyyy-MM-dd');

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
