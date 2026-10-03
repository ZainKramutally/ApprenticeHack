import { Heart, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useMyEventState, useOrganiser } from '../context/AppState';
import { fmtCard, startsAt } from '../lib/dates';
import { CATEGORY } from '../lib/events';
import type { Category, EventItem } from '../types';
import { EventBadges } from './Badge';

export function coverStyle(category: Category) {
  const c = CATEGORY[category].color;
  return { background: `linear-gradient(135deg, ${c} 0%, color-mix(in srgb, ${c} 55%, white) 100%)` };
}

export function HeartButton({ eventId, className = '' }: { eventId: string; className?: string }) {
  const { dispatch, state } = useApp();
  const { fav } = useMyEventState();
  const on = fav.has(eventId);
  if (!state.currentUserId) return null;
  return (
    <button
      type="button"
      aria-label={on ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={on}
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        dispatch({ type: 'toggleFavourite', eventId });
      }}
      className={`flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-110 ${className}`}
    >
      <Heart className={`size-[18px] ${on ? 'fill-accent text-accent' : 'text-gray-600'}`} />
    </button>
  );
}

interface Props {
  event: EventItem;
  /** Extra line under the badges, e.g. "Covers 2 of your gaps: K11, S8". */
  subtitle?: ReactNode;
  tags?: ReactNode;
  dimmed?: boolean;
  className?: string;
}

export function EventCard({ event, subtitle, tags, dimmed, className = '' }: Props) {
  const organiser = useOrganiser(event.organiserId);
  const { Icon } = CATEGORY[event.category];
  return (
    <Link
      to={`/event/${event.id}`}
      className={`card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white ${
        dimmed ? 'opacity-55 grayscale-[60%]' : ''
      } ${className}`}
    >
      <div className="relative flex h-24 items-center px-4" style={coverStyle(event.category)}>
        <Icon className="size-9 text-white drop-shadow-sm" strokeWidth={2} />
        <HeartButton eventId={event.id} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-sm font-semibold text-accent-dark">{fmtCard(startsAt(event))}</p>
        <h3 className="text-[17px] font-bold leading-snug">{event.title}</h3>
        <p className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="size-3.5 shrink-0" /> {event.area}, {event.city}
        </p>
        <p className="text-sm text-gray-500">{organiser?.name}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <EventBadges event={event} />
          {tags}
        </div>
        {subtitle && <p className="pt-1 text-sm font-medium text-ink">{subtitle}</p>}
      </div>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
    </div>
  );
}
