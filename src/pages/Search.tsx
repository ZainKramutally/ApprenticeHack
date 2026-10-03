import { addDays, addMonths } from 'date-fns';
import { Search as SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState, EventCard } from '../components/EventCard';
import { Chip, FilterChips } from '../components/FilterChips';
import { useAllEvents, useCurrentUser, useOrganisers } from '../context/AppState';
import { isUpcoming, startsAt } from '../lib/dates';
import { matchesFilters, upcomingThenPast, visibleTo, type Filters } from '../lib/events';
import { useDefaultFilters } from './Discover';

type When = 'week' | 'month' | 'any';
const WHEN: { id: When; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'any', label: 'Any time' },
];

export default function Search() {
  const user = useCurrentUser()!;
  const events = useAllEvents();
  const organisers = useOrganisers();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(useDefaultFilters());
  const [when, setWhen] = useState<When>('any');
  const [includePast, setIncludePast] = useState(false);

  const results = useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();
    const orgName = (id: string) => organisers.find((o) => o.id === id)?.name ?? '';
    // Date window is "from now until…"; past events (if included) ignore the forward window.
    const until = when === 'week' ? addDays(now, 7) : when === 'month' ? addMonths(now, 1) : null;
    const matched = events.filter((e) => {
      if (!visibleTo(e, user, now) || !matchesFilters(e, filters)) return false;
      const up = isUpcoming(e, now);
      if (!up && !includePast) return false;
      if (up && until && startsAt(e) > until) return false;
      if (!q) return true;
      return [e.title, e.description, orgName(e.organiserId), e.area, e.venue].some((s) => s.toLowerCase().includes(q));
    });
    return upcomingThenPast(matched, now);
  }, [events, organisers, user, query, filters, when, includePast]);

  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Search</h1>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, organisers, areas…"
          className="input w-full rounded-full py-3 pl-12 text-base"
          autoFocus
        />
      </div>

      <div className="card space-y-2 p-4">
        <FilterChips value={filters} onChange={setFilters} />
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">When</span>
          <div className="flex flex-wrap gap-2">
            {WHEN.map((w) => (
              <Chip key={w.id} active={when === w.id} onClick={() => setWhen(w.id)}>
                {w.label}
              </Chip>
            ))}
          </div>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={includePast} onChange={(e) => setIncludePast(e.target.checked)} className="size-4 accent-accent" />
            Include past events
          </label>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-500">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>
      {results.length === 0 ? (
        <EmptyState title="No events found.">Try a different word, clear a chip or include past events.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((e) => (
            <EventCard key={e.id} event={e} dimmed={!isUpcoming(e, now)} />
          ))}
        </div>
      )}
    </div>
  );
}
