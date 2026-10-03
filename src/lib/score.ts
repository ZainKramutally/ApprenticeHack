import { getKsb } from '../data/standards';
import type { Apprentice, City, EventItem, Ksb, User } from '../types';
import { byStartAsc, visibleTo } from './events';
import { startsAt } from './dates';

export function scoreEvent(e: EventItem, u: Apprentice, gaps: Set<string>, now: Date): number {
  if (!e.inWorkingHours) return 0;
  if (startsAt(e) <= now) return 0;
  let score = 0;
  for (const id of e.ksbs) {
    if (!gaps.has(id)) continue;
    score += u.coachFocus.includes(id) ? 2 : 1;
  }
  // P2 stretch: gateway boost
  // if (daysUntil(u.gatewayDate) < 180) score *= 1.5;
  return score;
}

export interface Recommendation {
  event: EventItem;
  score: number;
  covered: Ksb[]; // gap KSBs this event covers
  coachFocus: boolean;
}

/** Recommended strip: selected city + under-18 rule, score > 0, score desc then start asc, top 5. */
export function recommend(
  events: EventItem[],
  u: Apprentice,
  gaps: Set<string>,
  city: City,
  viewer: User,
  now: Date = new Date(),
  limit = 5,
): Recommendation[] {
  return events
    .filter((e) => e.city === city && visibleTo(e, viewer, now))
    .map((event) => {
      const coveredIds = event.ksbs.filter((id) => gaps.has(id));
      return {
        event,
        score: scoreEvent(event, u, gaps, now),
        covered: coveredIds.map((id) => getKsb(id)).filter((k): k is Ksb => !!k),
        coachFocus: coveredIds.some((id) => u.coachFocus.includes(id)),
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || byStartAsc(a.event, b.event))
    .slice(0, limit);
}

export function coversLabel(r: Recommendation): string {
  const n = r.covered.length;
  return `Covers ${n} of your gaps: ${r.covered.map((k) => k.code).join(', ')}`;
}
