import { addDays, differenceInCalendarDays, getDay, parseISO, startOfToday } from 'date-fns';
import { Check, Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventBadges } from '../components/Badge';
import { PickerMap } from '../components/EventMap';
import { Chip } from '../components/FilterChips';
import { useApp, useCurrentUser, useOrganiser } from '../context/AppState';
import { canTagKsbs } from '../data/organisers';
import { getStandard, KSB_TYPE_LABEL, STANDARDS } from '../data/standards';
import { isoDay } from '../lib/dates';
import { CATEGORIES, CATEGORY, CITIES, CITY_CENTRE } from '../lib/events';
import type { Category, City, EventItem, KsbType, StandardCode } from '../types';

/** Auto-on for Mon–Fri starts between 09:00 and 16:00. */
function looksLikeWorkingHours(date: string, start: string): boolean {
  if (!date || !start) return false;
  const dow = getDay(parseISO(date)); // 0 = Sun
  return dow >= 1 && dow <= 5 && start >= '09:00' && start <= '16:00';
}

const autoAdult = (c: Category) => c === 'networking' || c === 'music';

function nextWeekday(): string {
  let d = addDays(startOfToday(), 7);
  while (getDay(d) === 0 || getDay(d) === 6) d = addDays(d, 1);
  return isoDay(d);
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-gray-500">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-otj' : 'bg-stone-300'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function CreateEvent() {
  const { dispatch, toast } = useApp();
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const org = useOrganiser(user.role === 'organiser' ? user.organiserId : undefined);
  const ksbAllowed = canTagKsbs(org);

  const initialDate = nextWeekday();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('workshop');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<City>(org?.cities[0] ?? 'London');
  const [area, setArea] = useState('');
  const [venue, setVenue] = useState('');
  const [pin, setPin] = useState<[number, number]>(CITY_CENTRE[org?.cities[0] ?? 'London']);
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState('10:00');
  const [duration, setDuration] = useState(2);
  const [workingHours, setWorkingHours] = useState(looksLikeWorkingHours(initialDate, '10:00'));
  const [adult, setAdult] = useState(false);
  const [capacity, setCapacity] = useState(30);
  const [standards, setStandards] = useState<StandardCode[]>([]);
  const [ksbs, setKsbs] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  const errors = {
    title: title.trim() ? undefined : 'Give your event a title',
    description: description.trim().length >= 20 ? undefined : 'Write at least a sentence (20+ characters)',
    area: area.trim() ? undefined : 'Add the area, e.g. Shoreditch',
    venue: venue.trim() ? undefined : 'Add the venue name',
    date: date ? undefined : 'Pick a date',
  };
  const valid = Object.values(errors).every((e) => !e);

  const changeDateTime = (d: string, s: string) => {
    setDate(d);
    setStart(s);
    setWorkingHours(looksLikeWorkingHours(d, s));
  };
  const changeCategory = (c: Category) => {
    setCategory(c);
    setAdult(autoAdult(c));
  };
  const changeCity = (c: City) => {
    setCity(c);
    setPin(CITY_CENTRE[c]);
  };
  const toggleStandard = (code: StandardCode) => {
    if (standards.includes(code)) {
      setStandards(standards.filter((s) => s !== code));
      setKsbs(ksbs.filter((id) => !id.startsWith(`${code}-`)));
    } else setStandards([...standards, code]);
  };
  const toggleKsb = (id: string) => setKsbs((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const draft: EventItem = {
    id: `evt-${Date.now().toString(36)}`,
    title: title.trim(),
    category,
    organiserId: org?.id ?? '',
    city,
    area: area.trim(),
    venue: venue.trim(),
    lat: pin[0],
    lng: pin[1],
    dayOffset: date ? differenceInCalendarDays(parseISO(date), startOfToday()) : 0,
    date,
    start,
    durationHours: Math.max(0.5, Number(duration) || 1),
    inWorkingHours: workingHours,
    ageRestricted18: adult,
    capacity: Math.max(1, Number(capacity) || 1),
    goingCount: 0,
    ksbs: ksbAllowed ? ksbs : [],
    description: description.trim(),
  };

  const publish = () => {
    setTried(true);
    if (!valid || !org) return;
    dispatch({ type: 'addEvent', event: draft });
    toast('Your event is live');
    navigate(`/event/${draft.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Create event</h1>
      <p className="mb-6 text-gray-600">
        Posting as <span className="font-semibold">{org?.name}</span>
      </p>

      <form
        noValidate
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          publish();
        }}
      >
        <section className="card space-y-4 p-6">
          <Field label="Title" error={tried ? errors.title : undefined}>
            <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Intro to Secure Coding" />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const { Icon, label, color } = CATEGORY[c];
                return (
                  <Chip key={c} active={category === c} onClick={() => changeCategory(c)}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-4" style={{ color: category === c ? '#fff' : color }} /> {label}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          <Field label="Description" error={tried ? errors.description : undefined}>
            <textarea
              className="input w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will apprentices do and take away?"
            />
          </Field>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">Where</h2>
          <Field label="City">
            <div className="flex gap-2">
              {CITIES.map((c) => (
                <Chip key={c} active={city === c} onClick={() => changeCity(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area" error={tried ? errors.area : undefined}>
              <input className="input w-full" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Canary Wharf" />
            </Field>
            <Field label="Venue" error={tried ? errors.venue : undefined}>
              <input className="input w-full" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Northline Bank, Level 3" />
            </Field>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold">Location</p>
            <p className="mb-2 text-xs text-gray-500">Click the map to drop the pin.</p>
            <PickerMap
              center={CITY_CENTRE[city]}
              value={pin}
              category={category}
              onPick={(lat, lng) => setPin([lat, lng])}
              className="h-64 w-full rounded-xl"
            />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">When</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" error={tried ? errors.date : undefined}>
              <input className="input w-full" type="date" value={date} onChange={(e) => changeDateTime(e.target.value, start)} />
            </Field>
            <Field label="Start time">
              <input className="input w-full" type="time" value={start} onChange={(e) => changeDateTime(date, e.target.value)} />
            </Field>
            <Field label="Duration (hours)">
              <input className="input w-full" type="number" min={0.5} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle on={workingHours} onChange={setWorkingHours} label="In working hours" hint="Auto-on for Mon–Fri starts 09:00–16:00" />
            <Toggle on={adult} onChange={setAdult} label="18+" hint="Auto-on for Networking and Music" />
          </div>
          <Field label="Capacity" className="max-w-40">
            <input className="input w-full" type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </Field>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">KSB tags</h2>
          {!ksbAllowed ? (
            <p className="flex items-start gap-2 rounded-xl bg-stone-100 px-4 py-3 text-sm text-gray-700">
              <Info className="mt-0.5 size-4 shrink-0" />
              Apprentice-run groups can post socials only. Employers, training providers and universities can tag KSBs.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Pick the standards this event is relevant to, then tick the KSBs it builds.</p>
              <div className="flex flex-wrap gap-2">
                {STANDARDS.map((s) => (
                  <Chip key={s.code} active={standards.includes(s.code)} onClick={() => toggleStandard(s.code)}>
                    {s.shortName}
                  </Chip>
                ))}
              </div>
              {standards.map((code) => {
                const std = getStandard(code);
                return (
                  <div key={code} className="rounded-xl border border-line p-4">
                    <p className="mb-2 text-sm font-bold">{std.title}</p>
                    {(['K', 'S', 'B'] as KsbType[]).map((t) => (
                      <div key={t} className="mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{KSB_TYPE_LABEL[t]}</p>
                        <ul className="grid gap-0.5 sm:grid-cols-2">
                          {std.ksbs
                            .filter((k) => k.type === t)
                            .map((k) => {
                              const on = ksbs.includes(k.id);
                              return (
                                <li key={k.id}>
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={on}
                                    onClick={() => toggleKsb(k.id)}
                                    className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-stone-50"
                                  >
                                    <span
                                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
                                        on ? 'border-accent bg-accent text-white' : 'border-gray-300'
                                      }`}
                                    >
                                      {on && <Check className="size-3" strokeWidth={3.5} />}
                                    </span>
                                    <span>
                                      <span className="mr-1 font-bold">{k.code}</span>
                                      {k.text}
                                      {k.pathway && <span className="text-gray-400"> ({k.pathway})</span>}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Preview: <EventBadges event={draft} />
          </div>
          <button type="submit" className="btn-primary px-8 py-3">
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
