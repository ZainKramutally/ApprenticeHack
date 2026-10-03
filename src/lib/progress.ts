import { userKsbs } from '../data/standards';
import type { Apprentice, Attendance, EventItem, Ksb } from '../types';
import { countsForOtj } from './events';

export interface Progress {
  ksbs: Ksb[]; // the user's KSB list (core + their pathway)
  signedOff: Set<string>;
  evidenced: Set<string>; // tagged on attended OTJ events, not yet signed off
  gaps: Set<string>; // neither signed off nor evidenced
  otjFromEvents: number;
  otjTotal: number;
}

export function computeProgress(u: Apprentice, attendance: Attendance[], eventsById: Map<string, EventItem>): Progress {
  const ksbs = userKsbs(u);
  const own = new Set(ksbs.map((k) => k.id));
  const signedOff = new Set(u.signedOff.filter((id) => own.has(id)));

  const evidenced = new Set<string>();
  let otjFromEvents = 0;
  for (const a of attendance) {
    if (a.userId !== u.id) continue;
    const e = eventsById.get(a.eventId);
    if (!e || !countsForOtj(e)) continue;
    otjFromEvents += a.hours;
    for (const id of e.ksbs) if (own.has(id) && !signedOff.has(id)) evidenced.add(id);
  }

  const gaps = new Set(ksbs.map((k) => k.id).filter((id) => !signedOff.has(id) && !evidenced.has(id)));
  return { ksbs, signedOff, evidenced, gaps, otjFromEvents, otjTotal: u.otjLoggedHours + otjFromEvents };
}

export type KsbStatus = 'signed' | 'evidenced' | 'focus' | 'need';

export function ksbStatus(id: string, u: Apprentice, p: Progress): KsbStatus | null {
  if (p.signedOff.has(id)) return 'signed';
  if (p.evidenced.has(id)) return 'evidenced';
  if (!p.gaps.has(id)) return null; // not on this learner's standard/pathway
  return u.coachFocus.includes(id) ? 'focus' : 'need';
}

export const STATUS_LABEL: Record<KsbStatus, string> = {
  focus: 'Coach focus',
  need: 'You need this',
  evidenced: 'Evidenced, awaiting sign-off',
  signed: 'Signed off',
};
