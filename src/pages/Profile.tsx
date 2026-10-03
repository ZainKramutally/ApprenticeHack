import { parseISO } from 'date-fns';
import { FileText, LogOut, MapPin, PencilLine, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AttendModal } from '../components/AttendModal';
import { OrganiserTypeBadge, StatusPill, VerifiedTick } from '../components/Badge';
import { EmptyState, EventCard } from '../components/EventCard';
import { ProgressBar, ProgressRing, StatTile } from '../components/StatTile';
import { useAllEvents, useApp, useApprentice, useCurrentUser, useMyEventState, useOrganiser, useProgress } from '../context/AppState';
import { getKsb, getStandard, KSB_TYPE_LABEL } from '../data/standards';
import { daysUntil, fmtCard, fmtLong, isUpcoming, startsAt } from '../lib/dates';
import { checkEmail } from '../lib/email';
import { byStartAsc, byStartDesc } from '../lib/events';
import { ksbStatus } from '../lib/progress';
import { num } from '../lib/report';
import type { Apprentice, EventItem, KsbType } from '../types';

function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-stone-100 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            value === o.id ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-gray-400">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function DemoFooter() {
  const { dispatch, toast } = useApp();
  const navigate = useNavigate();
  return (
    <footer className="flex flex-wrap justify-center gap-2 border-t border-line pt-6 text-sm">
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          dispatch({ type: 'logout' });
          navigate('/welcome');
        }}
      >
        <LogOut className="size-4" /> Switch demo persona
      </button>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          if (!window.confirm('Reset all demo data back to the seed?')) return;
          dispatch({ type: 'reset' });
          toast('Demo data reset');
        }}
      >
        <RotateCcw className="size-4" /> Reset demo data
      </button>
    </footer>
  );
}

export default function Profile() {
  const user = useCurrentUser()!;
  return user.role === 'apprentice' ? <ApprenticeProfile /> : <OrganiserProfile />;
}

function ApprenticeProfile() {
  const { dispatch } = useApp();
  const user = useApprentice() as Apprentice;
  const p = useProgress()!;
  const events = useAllEvents();
  const { rsvp, attended } = useMyEventState();
  const std = getStandard(user.standardCode);
  const verified = checkEmail(user.email).verified;
  const [ksbTab, setKsbTab] = useState<KsbType>('K');
  const [evTab, setEvTab] = useState<'upcoming' | 'confirm' | 'attended'>('upcoming');
  const [attending, setAttending] = useState<EventItem | null>(null);

  const now = new Date();
  const lists = useMemo(() => {
    const mine = events.filter((e) => rsvp.has(e.id) || attended.has(e.id));
    return {
      upcoming: mine.filter((e) => isUpcoming(e, now) && rsvp.has(e.id) && !attended.has(e.id)).sort(byStartAsc),
      confirm: mine.filter((e) => !isUpcoming(e, now) && rsvp.has(e.id) && !attended.has(e.id)).sort(byStartDesc),
      attended: mine.filter((e) => attended.has(e.id)).sort(byStartDesc),
    };
  }, [events, rsvp, attended]); // eslint-disable-line react-hooks/exhaustive-deps

  const otjPct = user.otjTargetHours > 0 ? p.otjTotal / user.otjTargetHours : 0;
  const days = daysUntil(user.gatewayDate);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8 md:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-white">
            {user.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{user.name}</h1>
              <VerifiedTick verified={verified} />
            </div>
            <p className="font-medium text-gray-700">
              {std.title} · Level {std.level} · {user.pathway}
            </p>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
              <span>{user.provider}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {user.city}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/onboarding?edit=baseline" className="btn-secondary">
            <PencilLine className="size-4" /> Edit baseline
          </Link>
          <Link to="/report" className="btn-primary">
            <FileText className="size-4" /> Generate report
          </Link>
        </div>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="KSBs signed off"
          value={
            <>
              {p.signedOff.size}
              <span className="text-lg font-bold text-gray-400"> / {p.ksbs.length}</span>
            </>
          }
          visual={<ProgressRing value={p.signedOff.size / p.ksbs.length} />}
        />
        <StatTile
          label="Evidenced, awaiting sign-off"
          value={<span className="text-amber-600">{p.evidenced.size}</span>}
          sub={p.evidenced.size ? `${p.ksbs.filter((k) => p.evidenced.has(k.id)).map((k) => k.code).join(', ')}` : 'Attend events to add evidence'}
        />
        <StatTile
          label="OTJ hours"
          value={
            <>
              {num(p.otjTotal)}
              <span className="text-lg font-bold text-gray-400"> / {num(user.otjTargetHours)}</span>
            </>
          }
          sub={
            <div className="space-y-1.5">
              <ProgressBar value={otjPct} />
              <p>
                {Math.round(otjPct * 100)}% · {num(p.otjFromEvents)} from events
              </p>
            </div>
          }
        />
        <StatTile label="Days to gateway" value={num(days)} sub={fmtLong(parseISO(user.gatewayDate))} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Coach focus */}
        <section className="card min-w-0 p-6 lg:col-span-2">
          <h2 className="section-title mb-1">Coach's focus</h2>
          <p className="mb-3 text-sm text-gray-600">The KSBs your skills coach wants you to work on next.</p>
          {user.coachFocus.length === 0 ? (
            <p className="text-sm text-gray-500">No focus KSBs set. Add some in Edit baseline.</p>
          ) : (
            <ul className="divide-y divide-line">
              {user.coachFocus.map((id) => {
                const k = getKsb(id);
                const status = ksbStatus(id, user, p);
                if (!k) return null;
                return (
                  <li key={id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-3">
                    <p className="min-w-[55%] flex-1 text-sm">
                      <span className="mr-2 font-bold">{k.code}</span>
                      {k.text}
                    </p>
                    {status && <StatusPill status={status} />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* KSB checklist */}
        <section className="card min-w-0 p-6 lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="section-title">KSB checklist</h2>
              <p className="text-sm text-gray-600">Tap a KSB to mark it signed off (or undo).</p>
            </div>
          </div>
          <Tabs
            value={ksbTab}
            onChange={setKsbTab}
            options={(['K', 'S', 'B'] as KsbType[]).map((t) => ({
              id: t,
              label: KSB_TYPE_LABEL[t],
              count: p.ksbs.filter((k) => k.type === t).length,
            }))}
          />
          <ul className="mt-3 divide-y divide-line">
            {p.ksbs
              .filter((k) => k.type === ksbTab)
              .map((k) => {
                const status = ksbStatus(k.id, user, p);
                return (
                  <li key={k.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'toggleSignedOff', ksbId: k.id })}
                      className="flex w-full flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-lg px-2 py-2.5 text-left hover:bg-stone-50"
                    >
                      <span className={`min-w-[55%] flex-1 text-sm ${status === 'signed' ? 'text-gray-400' : ''}`}>
                        <span className="mr-2 inline-block min-w-9 font-bold">{k.code}</span>
                        {k.text}
                      </span>
                      {status && <StatusPill status={status} />}
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>

      {/* My events */}
      <section className="space-y-4">
        <h2 className="section-title">My events</h2>
        <Tabs
          value={evTab}
          onChange={setEvTab}
          options={[
            { id: 'upcoming', label: 'Upcoming', count: lists.upcoming.length },
            { id: 'confirm', label: 'To confirm', count: lists.confirm.length },
            { id: 'attended', label: 'Attended', count: lists.attended.length },
          ]}
        />
        {evTab === 'upcoming' &&
          (lists.upcoming.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming RSVPs.">
              <Link to="/" className="font-semibold text-accent-dark">
                Find events on Discover
              </Link>
            </EmptyState>
          ))}
        {evTab === 'confirm' &&
          (lists.confirm.length ? (
            <ul className="space-y-3">
              {lists.confirm.map((e) => (
                <li key={e.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={`/event/${e.id}`} className="min-w-0">
                    <p className="text-sm font-semibold text-accent-dark">{fmtCard(startsAt(e))}</p>
                    <p className="font-bold">{e.title}</p>
                    <p className="text-sm text-gray-500">
                      {e.area}, {e.city}
                    </p>
                  </Link>
                  <button type="button" className="btn-primary shrink-0" onClick={() => setAttending(e)}>
                    Mark "I went"
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing to confirm.">Past events you RSVP'd to will show here.</EmptyState>
          ))}
        {evTab === 'attended' &&
          (lists.attended.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.attended.map((e) => (
                <EventCard key={e.id} event={e} subtitle="Attended ✓ · included in your report" />
              ))}
            </div>
          ) : (
            <EmptyState title="No attended events yet.">Mark past events as attended from "To confirm".</EmptyState>
          ))}
      </section>

      <div className="flex justify-center">
        <Link to="/report" className="btn-primary px-8 py-3 text-lg">
          <FileText className="size-5" /> Generate report
        </Link>
      </div>

      <DemoFooter />

      {attending && <AttendModal event={attending} onClose={() => setAttending(null)} />}
    </div>
  );
}

function OrganiserProfile() {
  const user = useCurrentUser()!;
  const org = useOrganiser(user.role === 'organiser' ? user.organiserId : undefined);
  const events = useAllEvents();
  const verified = checkEmail(user.email).verified;
  const mine = events.filter((e) => e.organiserId === org?.id);
  const now = new Date();
  const upcoming = mine.filter((e) => isUpcoming(e, now)).sort(byStartAsc);
  const past = mine.filter((e) => !isUpcoming(e, now)).sort(byStartDesc);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-extrabold text-white">
            {user.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{user.name}</h1>
              <VerifiedTick verified={verified} />
            </div>
            {org && (
              <p className="flex flex-wrap items-center gap-2 font-medium text-gray-700">
                Organiser at {org.name} <OrganiserTypeBadge type={org.type} />
              </p>
            )}
            <p className="text-sm text-gray-500">{org?.cities.join(' · ')}</p>
          </div>
        </div>
        <Link to="/create" className="btn-primary">
          Create event
        </Link>
      </header>

      {org?.type === 'apprentice' && (
        <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-gray-700">
          Apprentice-run groups can post socials. Only employers, training providers and universities can tag KSBs.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="section-title">Your upcoming events</h2>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} subtitle={`${e.goingCount} going · ${e.capacity} places`} />
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming events yet.">
            <Link to="/create" className="font-semibold text-accent-dark">
              Create your first event
            </Link>
          </EmptyState>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title">Past events</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((e) => (
              <EventCard key={e.id} event={e} dimmed />
            ))}
          </div>
        </section>
      )}

      <DemoFooter />
    </div>
  );
}
