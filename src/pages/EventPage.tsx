import { Check, ChevronLeft, Clock, ExternalLink, MapPin, MessageCircle, PencilLine, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AttendModal } from '../components/AttendModal';
import { Avatar } from '../components/Avatar';
import { EventBadges, OrganiserTypeBadge } from '../components/Badge';
import { coverStyle, EmptyState, HeartButton } from '../components/EventCard';
import { StaticMap } from '../components/EventMap';
import { KsbList } from '../components/KsbList';
import {
  goingTotal,
  useApp,
  useApprentice,
  useChatActions,
  useChatSummaries,
  useCurrentUser,
  useDirectory,
  useEventsById,
  useMyEventState,
  useOrganiser,
  useProgress,
} from '../context/AppState';
import { visibleAttendees } from '../lib/chat';
import { fmtRange, isUpcoming } from '../lib/dates';
import { CATEGORY, visibleTo } from '../lib/events';
import type { Apprentice, EventItem, User } from '../types';

/** P1: "{n} from your course". A stable demo estimate from how much of the event targets this standard. */
function fromYourCourse(e: EventItem, u: Apprentice, going: number): number {
  const tagged = e.ksbs.filter((id) => id.startsWith(`${u.standardCode}-`)).length;
  if (tagged === 0) return 0;
  const share = Math.min(0.6, tagged / Math.max(e.ksbs.length, 1));
  return Math.max(1, Math.round(going * share * 0.7));
}

const googleMapsUrl = (e: EventItem) => `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`;

/** Group-chat entry point: open it (with unread count) if you're in, otherwise offer to join. */
function ChatButton({ event, canJoin }: { event: EventItem; canJoin: boolean }) {
  const { state } = useApp();
  const { join } = useChatActions();
  const summary = useChatSummaries().find((c) => c.event.id === event.id);
  const isMember = state.chatMembers.some((m) => m.userId === state.currentUserId && m.eventId === event.id);
  if (isMember) {
    return (
      <Link to={`/chats/${event.id}`} className="btn-secondary">
        <MessageCircle className="size-4" /> Group chat
        {summary && summary.unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">{summary.unread}</span>
        )}
      </Link>
    );
  }
  if (!canJoin) return null;
  return (
    <button type="button" className="btn-secondary" onClick={() => join(event)}>
      <MessageCircle className="size-4" /> Join group chat
    </button>
  );
}

/** "Who's going": names respect each person's privacy setting; the count stays honest. */
function WhosGoing({ event, viewer, total }: { event: EventItem; viewer: User; total: number }) {
  const { state } = useApp();
  const dir = useDirectory();
  const rsvpUserIds = state.rsvps.filter((r) => r.eventId === event.id).map((r) => r.userId);
  const { shown, meHidden } = visibleAttendees(event, rsvpUserIds, viewer, dir);
  if (shown.length === 0) return null;
  const names = shown.slice(0, 3).map((a) => a.name);
  const rest = Math.max(0, total - names.length);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {shown.slice(0, 6).map((a) => (
            <span key={a.id} title={a.detail ? `${a.name} · ${a.detail}` : a.name}>
              <Avatar id={a.id} name={a.name === 'You' ? viewer.name : a.name} size={30} />
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{names.join(', ')}</span>
          {rest > 0 && <> and {rest} others</>} {total === 1 ? 'is' : 'are'} going
        </p>
      </div>
      {meHidden && (
        <p className="text-xs text-gray-500">
          Only you can see yourself here. Change this in{' '}
          <Link to="/profile#privacy" className="font-semibold text-accent-dark">
            Privacy settings
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const { rsvp: toggleRsvp, autoJoinDefault } = useChatActions();
  const [joinChat, setJoinChat] = useState(autoJoinDefault);
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
  const goingCount = goingTotal(event, state.rsvps);
  const isHost = user.role === 'organiser' && user.organiserId === event.organiserId;

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
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <MapPin className="size-4 shrink-0 text-gray-400" /> {event.venue}, {event.area}, {event.city}
                <a
                  href={googleMapsUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-accent-dark hover:underline"
                >
                  Open in Google Maps <ExternalLink className="size-3.5" />
                </a>
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

          <WhosGoing event={event} viewer={user} total={goingCount} />

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
                  <ChatButton event={event} canJoin={going} />
                </>
              ) : upcoming && !going ? (
                <>
                  <button type="button" onClick={() => toggleRsvp(event, joinChat)} className="btn-primary">
                    RSVP
                  </button>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={joinChat} onChange={(e) => setJoinChat(e.target.checked)} className="size-4 accent-accent" />
                    Join the group chat
                  </label>
                </>
              ) : upcoming && going ? (
                <>
                  <button
                    type="button"
                    aria-pressed
                    title="Cancel RSVP"
                    onClick={() => toggleRsvp(event, false)}
                    className="btn-secondary border-otj text-otj"
                  >
                    <Check className="size-4" strokeWidth={3} /> Going
                  </button>
                  <ChatButton event={event} canJoin />
                </>
              ) : going ? (
                <>
                  <button type="button" onClick={() => setModal(true)} className="btn-primary">
                    Mark "I went"
                  </button>
                  <ChatButton event={event} canJoin />
                </>
              ) : (
                <span className="text-sm text-gray-500">This event has ended.</span>
              )}
            </div>
          )}
          {isHost && (
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <span className="text-sm font-medium text-gray-600">You're hosting this event.</span>
              <Link to={`/chats/${event.id}`} className="btn-secondary">
                <MessageCircle className="size-4" /> Group chat
              </Link>
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
