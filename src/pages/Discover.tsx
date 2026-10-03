import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoachFocusTag } from '../components/Badge';
import { EmptyState, EventCard } from '../components/EventCard';
import { EventMap } from '../components/EventMap';
import { FilterChips } from '../components/FilterChips';
import { useAllEvents, useApprentice, useCurrentUser, useOrganiser, useProgress } from '../context/AppState';
import { isUpcoming } from '../lib/dates';
import { byStartAsc, CITY_CENTRE, matchesFilters, visibleTo, type Filters } from '../lib/events';
import { coversLabel, recommend } from '../lib/score';
import type { City } from '../types';

export function useDefaultFilters(): Filters {
  const user = useCurrentUser();
  const apprentice = useApprentice();
  const org = useOrganiser(user?.role === 'organiser' ? user.organiserId : undefined);
  return {
    course: apprentice?.standardCode ?? 'ST0119',
    city: apprentice?.city ?? (org?.cities[0] as City | undefined) ?? 'London',
    types: [],
  };
}

export default function Discover() {
  const user = useCurrentUser()!;
  const apprentice = useApprentice();
  const progress = useProgress();
  const events = useAllEvents();
  const [filters, setFilters] = useState<Filters>(useDefaultFilters());

  const now = new Date();
  const filtered = useMemo(
    () => events.filter((e) => isUpcoming(e, now) && visibleTo(e, user, now) && matchesFilters(e, filters)).sort(byStartAsc),
    [events, user, filters], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const nearby = filtered.slice(0, 10);

  const recs = useMemo(
    () => (apprentice && progress ? recommend(events, apprentice, progress.gaps, filters.city, user) : []),
    [events, apprentice, progress, filters.city, user],
  );

  return (
    <div>
      {/* 1. Map */}
      <div className="h-[45vh] min-h-[280px] w-full border-b border-line">
        <EventMap events={filtered} center={CITY_CENTRE[filters.city]} className="h-full w-full" />
      </div>

      {/* 2. Filter chips, sticky under the map */}
      <div className="sticky top-0 z-[1010] border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto max-w-5xl">
          <FilterChips value={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
        {/* 3. Recommended */}
        {apprentice && (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="section-title">Recommended for your KSBs</h2>
                <p className="text-sm text-gray-600">Working-hours events in {filters.city} that fill your KSB gaps.</p>
              </div>
              <Link to="/profile" className="btn-ghost hidden sm:inline-flex">
                Your KSBs
              </Link>
            </div>
            {recs.length === 0 ? (
              <EmptyState title="You're on track. Check back for new events." />
            ) : (
              <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
                {recs.map((r, i) => (
                  <EventCard
                    key={r.event.id}
                    event={r.event}
                    className={`w-[280px] shrink-0 snap-start ${i === 0 ? 'ring-2 ring-accent/60' : ''}`}
                    tags={r.coachFocus ? <CoachFocusTag /> : undefined}
                    subtitle={coversLabel(r)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. Nearby */}
        <section>
          <h2 className="section-title mb-4">
            {nearby.length} {nearby.length === 1 ? 'event' : 'events'} nearby
          </h2>
          {nearby.length === 0 ? (
            <EmptyState title="No events match these filters.">Try clearing a type chip or switching city.</EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {nearby.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
