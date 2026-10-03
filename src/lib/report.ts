import { getKsb, getStandard } from '../data/standards';
import type { Apprentice, Attendance, Category, EventItem, Ksb } from '../types';
import { daysUntil, fmtLong, fmtShort, fmtTime, isoDay, startsAt } from './dates';
import type { Progress } from './progress';
import type { Recommendation } from './score';
import { parseISO } from 'date-fns';

export interface ReportItem {
  event: EventItem;
  attendance: Attendance;
  organiserName: string;
}

export const DISCLAIMER = 'Attendance is self-declared. Check with your skills coach before submitting.';

const ACTIVITY_TYPE: Record<Category, string> = {
  workshop: 'Workshop / training session',
  hackathon: 'Competition / hackathon',
  networking: 'Networking / professional event',
  music: 'Other',
  hangout: 'Other',
};

export const num = (n: number) => n.toLocaleString('en-GB');
export const hoursLabel = (h: number) => `${num(h)} ${h === 1 ? 'hour' : 'hours'}`;

export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
}

/** The event's KSBs that sit on this learner's KSB list, in tag order. */
export function eventKsbsForUser(e: EventItem, p: Progress): Ksb[] {
  const own = new Set(p.ksbs.map((k) => k.id));
  return e.ksbs.filter((id) => own.has(id)).map((id) => getKsb(id)!);
}

const ksbLine = (k: Ksb) => `${k.code} ${k.text}`;

export function otjEntry(item: ReportItem, p: Progress): string {
  const { event: e, attendance: a } = item;
  const ksbs = eventKsbsForUser(e, p);
  return [
    `Date: ${fmtLong(startsAt(e))}`,
    `Start time: ${fmtTime(startsAt(e))}`,
    `Duration: ${hoursLabel(a.hours)}`,
    `Activity type: ${ACTIVITY_TYPE[e.category]}`,
    `In working hours: ${e.inWorkingHours ? 'Yes' : 'No'}`,
    `Event: ${e.title}, ${item.organiserName}, ${e.area}, ${e.city}`,
    `Description: ${firstSentence(e.description)} ${a.notes.trim()}`,
    `KSBs evidenced: ${ksbs.length ? ksbs.map(ksbLine).join('; ') : 'None on your standard'}`,
  ].join('\n');
}

export interface KsbWriteup {
  ksb: Ksb;
  items: ReportItem[];
}

/** One write-up per KSB evidenced by the selected events (not already signed off), in standard order. */
export function ksbWriteups(items: ReportItem[], p: Progress): KsbWriteup[] {
  return p.ksbs
    .filter((k) => !p.signedOff.has(k.id))
    .map((ksb) => ({ ksb, items: items.filter((i) => i.event.ksbs.includes(ksb.id)) }))
    .filter((w) => w.items.length > 0);
}

export function writeupText(w: KsbWriteup): string {
  const blocks = w.items.map(({ event: e, attendance: a, organiserName }) =>
    [
      `What I did: Attended ${e.title} (${organiserName}, ${fmtLong(startsAt(e))}, ${hoursLabel(a.hours)}). ${e.description}`,
      `What I learned: ${a.notes.trim()}`,
      `How I'll apply it at work: ${a.apply.trim() || 'To discuss with my skills coach.'}`,
    ].join('\n'),
  );
  return [ksbLine(w.ksb), ...blocks].join('\n');
}

const codes = (p: Progress, set: Set<string>) => p.ksbs.filter((k) => set.has(k.id)).map((k) => k.code);

export function progressSummary(u: Apprentice, p: Progress, recs: Recommendation[]): string {
  const std = getStandard(u.standardCode);
  const evid = codes(p, p.evidenced);
  const gaps = codes(p, p.gaps);
  const focus = u.coachFocus
    .map((id) => getKsb(id))
    .filter((k): k is Ksb => !!k)
    .map((k) => {
      const s = p.signedOff.has(k.id) ? 'signed off' : p.evidenced.has(k.id) ? 'evidenced' : 'still to evidence';
      return `${k.code} ${s}`;
    });
  const pct = u.otjTargetHours > 0 ? Math.round((p.otjTotal / u.otjTargetHours) * 100) : 0;
  const days = daysUntil(u.gatewayDate);
  const list = (xs: string[]) => (xs.length ? ` (${xs.join(', ')})` : '');
  return [
    `Off the Clock progress summary for ${u.name}`,
    `Standard: ${std.title} (Level ${std.level}), ${u.pathway}`,
    `KSBs signed off: ${p.signedOff.size} of ${p.ksbs.length}`,
    `Evidenced through events, awaiting sign-off: ${evid.length}${list(evid)}`,
    `Still to evidence: ${gaps.length}${list(gaps)}`,
    `Coach focus: ${focus.length ? focus.join(', ') : 'None set'}`,
    `OTJ hours: ${num(p.otjTotal)} of ${num(u.otjTargetHours)} (${pct}%)`,
    `Gateway: ${fmtLong(parseISO(u.gatewayDate))} (${days} days)`,
    `Next recommended events: ${
      recs.length ? recs.map((r) => `${r.event.title} (${fmtShort(startsAt(r.event))})`).join(', ') : 'None right now'
    }`,
  ].join('\n');
}

export function otherEventLine(e: EventItem): string {
  return `${e.title}, ${e.area}, ${fmtShort(startsAt(e))}`;
}

const CSV_COLUMNS = [
  'date', 'start_time', 'duration_hours', 'activity_type', 'in_working_hours', 'event_title', 'organiser',
  'location', 'ksb_codes', 'ksb_texts', 'what_i_did_and_learned', 'how_i_will_apply',
];

const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function buildCsv(items: ReportItem[], p: Progress): string {
  const rows = items.map(({ event: e, attendance: a, organiserName }) => {
    const ksbs = eventKsbsForUser(e, p);
    return [
      isoDay(startsAt(e)),
      fmtTime(startsAt(e)),
      a.hours,
      ACTIVITY_TYPE[e.category],
      e.inWorkingHours ? 'Yes' : 'No',
      e.title,
      organiserName,
      `${e.venue}, ${e.area}, ${e.city}`,
      ksbs.map((k) => k.code).join('; '),
      ksbs.map((k) => k.text).join('; '),
      a.notes.trim(),
      a.apply.trim(),
    ].map(q).join(',');
  });
  return [CSV_COLUMNS.map(q).join(','), ...rows].join('\r\n');
}

export function downloadCsv(csv: string, now = new Date()): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `off-the-clock-report-${isoDay(now)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
