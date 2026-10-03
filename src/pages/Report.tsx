import { format, subMonths } from 'date-fns';
import { Check, ChevronLeft, Copy, Download, Printer } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EventCard';
import { useAllEvents, useApp, useApprentice, useOrganisers, useProgress } from '../context/AppState';
import { getStandard } from '../data/standards';
import { fmtShort, isoDay, startsAt } from '../lib/dates';
import { countsForOtj } from '../lib/events';
import {
  buildCsv,
  copyText,
  DISCLAIMER,
  downloadCsv,
  hoursLabel,
  ksbWriteups,
  otherEventLine,
  otjEntry,
  progressSummary,
  writeupText,
  type ReportItem,
} from '../lib/report';
import { recommend } from '../lib/score';

function Section({ n, title, text, children }: { n: number; title: string; text: string; children: ReactNode }) {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  return (
    <section className="print-section card p-6 print:rounded-none print:border-0 print:border-t print:px-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight">
          <span className="mr-2 text-accent">{n}.</span>
          {title}
        </h2>
        <button
          type="button"
          disabled={!text}
          className="btn-secondary px-3.5 py-1.5 text-sm print:hidden"
          onClick={async () => {
            const ok = await copyText(text);
            toast(ok ? `${title} copied` : 'Copy failed, select the text instead');
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {children}
    </section>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-4 font-sans text-[14px] leading-relaxed text-gray-800 print:bg-transparent print:p-0">
      {children}
    </pre>
  );
}

export default function Report() {
  const user = useApprentice();
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <EmptyState title="Reports are for apprentices.">Switch to an apprentice persona to generate an evidence report.</EmptyState>
      </div>
    );
  }
  return <ReportInner />;
}

function ReportInner() {
  const { state } = useApp();
  const user = useApprentice()!;
  const p = useProgress()!;
  const events = useAllEvents();
  const organisers = useOrganisers();
  const std = getStandard(user.standardCode);

  const today = new Date();
  const [from, setFrom] = useState(isoDay(subMonths(today, 3)));
  const [to, setTo] = useState(isoDay(today));
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const inRange: ReportItem[] = useMemo(() => {
    const byId = new Map(events.map((e) => [e.id, e]));
    return state.attendance
      .filter((a) => a.userId === user.id)
      .map((a) => ({ attendance: a, event: byId.get(a.eventId)! }))
      .filter(({ event }) => event && isoDay(startsAt(event)) >= from && isoDay(startsAt(event)) <= to)
      .map((x) => ({ ...x, organiserName: organisers.find((o) => o.id === x.event.organiserId)?.name ?? 'Unknown organiser' }))
      .sort((a, b) => startsAt(a.event).getTime() - startsAt(b.event).getTime());
  }, [state.attendance, events, organisers, user.id, from, to]);

  const selected = inRange.filter((i) => !excluded.has(i.event.id));
  const otjItems = selected.filter((i) => countsForOtj(i.event));
  const socialItems = selected.filter((i) => !countsForOtj(i.event));

  const recs = recommend(events, user, p.gaps, user.city, user, today, 3);
  const writeups = ksbWriteups(otjItems, p);

  const otjText = otjItems.map((i) => otjEntry(i, p)).join('\n\n');
  const writeupsText = writeups.map(writeupText).join('\n\n');
  const summaryText = progressSummary(user, p, recs);
  const otherText = socialItems.map((i) => otherEventLine(i.event)).join('\n');

  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10 print:max-w-none print:space-y-4 print:p-0">
      {/* Print-only header */}
      <div className="hidden border-b-2 border-ink pb-2 text-sm font-semibold print:block">
        Off the Clock · Evidence report · {user.name} · {std.title} · generated {format(today, 'd MMM yyyy')}
      </div>

      <div className="space-y-1 print:hidden">
        <Link to="/profile" className="btn-ghost -ml-3">
          <ChevronLeft className="size-4" /> Profile
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Evidence report</h1>
            <p className="text-gray-600">Ready to paste or upload into OneFile or Aptem.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => downloadCsv(buildCsv(otjItems, p))} disabled={!otjItems.length}>
              <Download className="size-4" /> Download CSV
            </button>
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              <Printer className="size-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <section className="card space-y-4 p-6 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-sm font-semibold">From</span>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="input mt-1 block" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">To</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="input mt-1 block" />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Attended events in this range</p>
          {inRange.length === 0 ? (
            <p className="text-sm text-gray-500">
              No attended events yet. Go to{' '}
              <Link to="/profile" className="font-semibold text-accent-dark">
                Profile → To confirm
              </Link>{' '}
              and mark an event you went to.
            </p>
          ) : (
            <ul className="space-y-1">
              {inRange.map(({ event: e, attendance: a }) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={!excluded.has(e.id)}
                      onChange={() => toggle(e.id)}
                      className="size-4 accent-accent"
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-semibold">{e.title}</span>{' '}
                      <span className="text-gray-500">· {fmtShort(startsAt(e))}</span>
                    </span>
                    <span className={`text-xs font-semibold ${countsForOtj(e) ? 'text-otj' : 'text-social'}`}>
                      {countsForOtj(e) ? `OTJ · ${hoursLabel(a.hours)}` : 'Social'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Section n={1} title="OTJ log entries" text={otjText}>
        {otjItems.length ? (
          <div className="space-y-3">
            {otjItems.map((i) => (
              <Pre key={i.event.id}>{otjEntry(i, p)}</Pre>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No working-hours events selected.</p>
        )}
      </Section>

      <Section n={2} title="KSB evidence write-ups" text={writeupsText}>
        {writeups.length ? (
          <div className="space-y-3">
            {writeups.map((w) => (
              <Pre key={w.ksb.id}>{writeupText(w)}</Pre>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No KSBs evidenced by the selected events.</p>
        )}
      </Section>

      <Section n={3} title="Progress summary" text={summaryText}>
        <Pre>{summaryText}</Pre>
      </Section>

      <Section n={4} title="Other events attended" text={otherText}>
        {socialItems.length ? (
          <>
            <Pre>{otherText}</Pre>
            <p className="mt-2 text-xs text-gray-500">Social events are not counted as off-the-job training.</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">No social events selected.</p>
        )}
      </Section>

      <p className="text-center text-sm font-medium text-gray-600 print:text-left">{DISCLAIMER}</p>
    </div>
  );
}
