import { Check, ChevronLeft, Clock, MapPin, PencilLine, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AttendModal } from '../components/AttendModal';
import { EventBadges, OrganiserTypeBadge } from '../components/Badge';
import { coverStyle, EmptyState, HeartButton } from '../components/EventCard';
import { StaticMap } from '../components/EventMap';
import { KsbList } from '../components/KsbList';
import { useApp, useApprentice, useCurrentUser, useEventsById, useMyEventState, useOrganiser, useProgress } from '../context/AppState';
import { fmtRange, isUpcoming } from '../lib/dates';
import { CATEGORY, visibleTo } from '../lib/events';
import type { Apprentice, EventItem } from '../types';

/** P1: "{n} from your course". A stable demo estimate from how much of the event targets this standard. */
function fromYourCourse(e: EventItem, u: Apprentice, going: number): number {
  const tagged = e.ksbs.filter((id) => id.startsWith(`${u.standardCode}-`)).length;
  if (tagged === 0) return 0;
  const share = Math.min(0.6, tagged / Math.max(e.ksbs.length, 1));
  return Math.max(1, Math.round(going * share * 0.7));
}

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const user = useCurrentUser()!;
  const apprentice = useApprentice();
  const progress = useProgress();
  const event = useEventsById().get(id ?? '');
  const organiser = useOrganiser(event?.organiserId);
  const { rsvp, attended } = useMyEventState();
  const [modal, setModal] = useState(false);

  if (!event || !visibleTo(event, user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <EmptyState title="We couldn't find that event.">
          <Link to="/" className="font-semibold text-accent-dark">
            Back to Discover
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { Icon, label } = CATEGORY[event.category];
  const upcoming = isUpcoming(event);
  const going = rsvp.has(event.id);
  const attendance = attended.get(event.id);
  const goingCount = event.goingCount + (going ? 1 : 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost -ml-3 mb-4">
        <ChevronLeft className="size-4" /> Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="relative flex h-36 items-end justify-between p-6" style={coverStyle(event.category)}>
          <div className="flex items-center gap-2 text-white">
            <Icon className="size-10" />
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">{label}</span>
          </div>
          <HeartButton eventId={event.id} className="absolute right-4 top-4" />
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{event.title}</h1>
            <EventBadges event={event} size="md" />
            <div className="space-y-1.5 text-gray-700">
              <p className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-gray-400" /> {fmtRange(event)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-gray-400" /> {event.venue}, {event.area}, {event.city}
              </p>
            </div>
            {organiser && (
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-500">Hosted by</span>
                <span className="font-semibold">{organiser.name}</span>
                <OrganiserTypeBadge type={organiser.type} />
              </p>
            )}
          </div>

          <StaticMap event={event} className="h-44 w-full rounded-xl" />

          <p className="leading-relaxed text-gray-800">{event.description}</p>

          <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="size-4 text-gray-400" />
            {goingCount} apprentices going
            {apprentice && fromYourCourse(event, apprentice, goingCount) > 0 && (
              <span className="text-gray-500">· {fromYourCourse(event, apprentice, goingCount)} from your course</span>
            )}
            <span className="text-gray-400">· {event.capacity} places</span>
          </p>

          {/* Actions */}
          {apprentice && (
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              {attendance ? (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-otj-soft px-4 py-2 font-semibold text-otj">
                    <Check className="size-4" strokeWidth={3} /> Attended · included in your report
                  </span>
                  <button type="button" onClick={() => setModal(true)} className="btn-secondary">
                    <PencilLine className="size-4" /> Edit notes
                  </button>
                </>
              ) : upcoming ? (
                <button
                  type="button"
                  aria-pressed={going}
                  onClick={() => dispatch({ type: 'toggleRsvp', eventId: event.id })}
                  className={going ? 'btn-secondary border-otj text-otj' : 'btn-primary'}
                >
                  {going ? (
                    <>
                      <Check className="size-4" strokeWidth={3} /> Going
                    </>
                  ) : (
                    'RSVP'
                  )}
                </button>
              ) : going ? (
                <button type="button" onClick={() => setModal(true)} className="btn-primary">
                  Mark "I went"
                </button>
              ) : (
                <span className="text-sm text-gray-500">This event has ended.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {event.ksbs.length > 0 && (
        <section className="card mt-6 p-6">
          <h2 className="section-title mb-3">KSBs covered</h2>
          <KsbList ksbIds={event.ksbs} user={apprentice} progress={progress} />
        </section>
      )}

      {modal && <AttendModal event={event} existing={attendance} onClose={() => setModal(false)} />}
    </div>
  );
}
