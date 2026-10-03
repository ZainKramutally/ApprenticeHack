import { Link } from 'react-router-dom';
import { EmptyState, EventCard } from '../components/EventCard';
import { useAllEvents, useCurrentUser, useMyEventState } from '../context/AppState';
import { isUpcoming } from '../lib/dates';
import { upcomingThenPast, visibleTo } from '../lib/events';

export default function Favourites() {
  const user = useCurrentUser()!;
  const events = useAllEvents();
  const { fav } = useMyEventState();
  const now = new Date();
  const list = upcomingThenPast(
    events.filter((e) => fav.has(e.id) && visibleTo(e, user, now)),
    now,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Favourites</h1>
      {list.length === 0 ? (
        <EmptyState title="No favourites yet.">
          Tap the heart on any event to save it here.{' '}
          <Link to="/" className="font-semibold text-accent-dark">
            Browse Discover
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((e) => (
            <EventCard key={e.id} event={e} dimmed={!isUpcoming(e, now)} />
          ))}
        </div>
      )}
    </div>
  );
}
