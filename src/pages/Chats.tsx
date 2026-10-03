import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Bell, BellOff, ChevronLeft, Flag, Lock, LogOut, MessageCircle, Send, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Pill } from '../components/Badge';
import { EmptyState } from '../components/EventCard';
import {
  goingTotal,
  useApp,
  useChatActions,
  useChatSummaries,
  useCurrentUser,
  useDirectory,
  useEventsById,
  useMyEventState,
  useThreadBuilder,
  type ChatSummary,
} from '../context/AppState';
import { peopleGoing } from '../data/people';
import { canSeeGoing, isReadOnly, privacyOf, resolveAuthor, SYSTEM, type Author } from '../lib/chat';
import { fmtCard, startsAt } from '../lib/dates';
import { CATEGORY } from '../lib/events';
import type { ChatMessage, EventItem } from '../types';

function EventBubble({ event, size = 44 }: { event: EventItem; size?: number }) {
  const { Icon, color } = CATEGORY[event.category];
  return (
    <span className="flex shrink-0 items-center justify-center rounded-2xl text-white" style={{ width: size, height: size, background: color }}>
      <Icon className="size-5" />
    </span>
  );
}

function listTime(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

function dayLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE d MMM');
}

export default function Chats() {
  const { eventId } = useParams();
  const summaries = useChatSummaries();
  const event = useEventsById().get(eventId ?? '');

  return (
    <div className="flex h-full">
      {/* List: full width on mobile, left column on desktop */}
      <aside className={`${eventId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-line bg-white md:w-80`}>
        <div className="border-b border-line px-5 py-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Chats</h1>
          <p className="text-sm text-gray-500">You join an event's group chat when you RSVP.</p>
        </div>
        {summaries.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No chats yet.">
              RSVP to an event to meet the other apprentices going.{' '}
              <Link to="/" className="font-semibold text-accent-dark">
                Find events
              </Link>
            </EmptyState>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {summaries.map((s) => (
              <ChatRow key={s.event.id} summary={s} active={s.event.id === eventId} />
            ))}
          </ul>
        )}
      </aside>

      {/* Conversation */}
      <section className={`${eventId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-canvas`}>
        {event ? (
          <Conversation key={event.id} event={event} />
        ) : eventId ? (
          <div className="p-6">
            <EmptyState title="We couldn't find that chat." />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-500">
            <MessageCircle className="size-10 text-gray-300" />
            <p className="font-semibold">Pick a chat</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ChatRow({ summary: s, active }: { summary: ChatSummary; active: boolean }) {
  const dir = useDirectory();
  const last = s.last;
  let preview = 'No messages yet';
  if (last) {
    if (last.authorId === SYSTEM) preview = last.text;
    else {
      const a = resolveAuthor(last.authorId, dir);
      preview = `${a.me ? 'You' : a.name}: ${last.text}`;
    }
  }
  return (
    <li>
      <Link
        to={`/chats/${s.event.id}`}
        className={`flex items-center gap-3 border-b border-line/70 px-4 py-3 transition-colors ${active ? 'bg-accent-soft/50' : 'hover:bg-stone-50'}`}
      >
        <EventBubble event={s.event} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-bold">{s.event.title}</p>
            {last && <span className="shrink-0 text-xs text-gray-400">{listTime(last.sentAt)}</span>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={`truncate text-sm ${s.unread ? 'font-semibold text-ink' : 'text-gray-500'}`}>{preview}</p>
            {s.member.muted ? (
              <BellOff className="size-4 shrink-0 text-gray-400" aria-label="Muted" />
            ) : s.unread > 0 ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                {s.unread}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

function Conversation({ event }: { event: EventItem }) {
  const { state, dispatch, toast } = useApp();
  const navigate = useNavigate();
  const user = useCurrentUser()!;
  const dir = useDirectory();
  const build = useThreadBuilder();
  const { join, leave } = useChatActions();
  const { rsvp } = useMyEventState();
  const [showMembers, setShowMembers] = useState(false);
  const [draft, setDraft] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  const thread = build(event);
  const member = state.chatMembers.find((m) => m.userId === user.id && m.eventId === event.id);
  const isHost = user.role === 'organiser' && user.organiserId === event.organiserId;
  const canView = !!member || isHost;
  const readOnly = isReadOnly(event);
  const going = goingTotal(event, state.rsvps);

  // Opening a chat (and any new message while it's open) marks it read.
  useEffect(() => {
    if (member) dispatch({ type: 'markRead', eventId: event.id });
  }, [event.id, thread.length, !!member]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, canView]);

  const send = () => {
    if (!draft.trim()) return;
    dispatch({ type: 'postMessage', eventId: event.id, text: draft });
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-line bg-white px-3 py-3 md:px-5">
        <button type="button" onClick={() => navigate('/chats')} className="btn-ghost -ml-1 px-2 md:hidden" aria-label="Back to chats">
          <ChevronLeft className="size-5" />
        </button>
        <EventBubble event={event} size={40} />
        <div className="min-w-0 flex-1">
          <Link to={`/event/${event.id}`} className="block truncate font-bold hover:underline">
            {event.title}
          </Link>
          <p className="truncate text-xs text-gray-500">
            {fmtCard(startsAt(event))} · {going} going
          </p>
        </div>
        {canView && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setShowMembers((v) => !v)}
              aria-pressed={showMembers}
              className={`btn-ghost px-2.5 ${showMembers ? 'bg-stone-100 text-ink' : ''}`}
              title="People in this chat"
            >
              <Users className="size-[18px]" />
            </button>
            {member && (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'toggleMute', eventId: event.id });
                  toast(member.muted ? 'Chat unmuted' : 'Chat muted');
                }}
                className="btn-ghost px-2.5"
                title={member.muted ? 'Unmute' : 'Mute'}
              >
                {member.muted ? <BellOff className="size-[18px]" /> : <Bell className="size-[18px]" />}
              </button>
            )}
            {member && !isHost && (
              <button
                type="button"
                onClick={() => {
                  leave(event);
                  navigate('/chats');
                }}
                className="btn-ghost px-2.5"
                title="Leave chat"
              >
                <LogOut className="size-[18px]" />
              </button>
            )}
          </div>
        )}
      </header>

      {!canView ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <Lock className="mx-auto mb-3 size-8 text-gray-300" />
            <p className="font-semibold">Only people going and the host can see this chat.</p>
            {user.role === 'apprentice' &&
              (rsvp.has(event.id) ? (
                <button type="button" className="btn-primary mt-4" onClick={() => join(event)}>
                  Join group chat
                </button>
              ) : (
                <Link to={`/event/${event.id}`} className="btn-primary mt-4">
                  RSVP to join
                </Link>
              ))}
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
              <p className="mx-auto mb-4 flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-center text-xs text-gray-500 shadow-sm">
                <Lock className="size-3.5 shrink-0" /> Only people going and the host can see this chat. Be kind, and report anything that
                worries you.
              </p>
              <Messages thread={thread} dir={dir} />
            </div>

            {readOnly ? (
              <p className="border-t border-line bg-white px-5 py-4 text-center text-sm text-gray-500">
                This chat closed a week after the event. You can still read it.
              </p>
            ) : (
              <form
                className="flex items-end gap-2 border-t border-line bg-white px-3 py-3 md:px-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={`Message ${event.title}`}
                  aria-label="Message"
                  className="input max-h-32 min-h-11 flex-1 resize-none py-2.5"
                />
                <button type="submit" className="btn-primary size-11 shrink-0 p-0" disabled={!draft.trim()} aria-label="Send">
                  <Send className="size-[18px]" />
                </button>
              </form>
            )}
          </div>

          {showMembers && <MembersPanel event={event} onClose={() => setShowMembers(false)} />}
        </div>
      )}
    </>
  );
}

function Messages({ thread, dir }: { thread: ChatMessage[]; dir: ReturnType<typeof useDirectory> }) {
  const { dispatch, toast } = useApp();
  const authors = useMemo(() => new Map<string, Author>(), [dir]);
  const author = (id: string) => {
    if (!authors.has(id)) authors.set(id, resolveAuthor(id, dir));
    return authors.get(id)!;
  };

  return (
    <ol className="space-y-1">
      {thread.map((m, i) => {
        const prev = thread[i - 1];
        const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(m.sentAt);
        const dayRow = newDay ? (
          <li key={`${m.id}-day`} className="py-3 text-center text-xs font-semibold text-gray-400">
            {dayLabel(m.sentAt)}
          </li>
        ) : null;

        if (m.authorId === SYSTEM) {
          return [
            dayRow,
            <li key={m.id} className="py-1 text-center text-xs text-gray-500">
              {m.text}
            </li>,
          ];
        }

        const a = author(m.authorId);
        // Group consecutive messages from the same person within 10 minutes.
        const grouped =
          !newDay && prev && prev.authorId === m.authorId && parseISO(m.sentAt).getTime() - parseISO(prev.sentAt).getTime() < 10 * 60_000;

        if (a.me) {
          return [
            dayRow,
            <li key={m.id} className={`flex justify-end ${grouped ? '' : 'pt-2'}`}>
              <div className="max-w-[80%] md:max-w-[65%]">
                <p className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[15px] text-white">{m.text}</p>
                {!grouped && <p className="mt-0.5 text-right text-[11px] text-gray-400">{format(parseISO(m.sentAt), 'HH:mm')}</p>}
              </div>
            </li>,
          ];
        }

        return [
          dayRow,
          <li key={m.id} className={`group flex items-end gap-2 ${grouped ? '' : 'pt-2'}`}>
            <span className="w-8 shrink-0">{!grouped && <Avatar id={a.id} name={a.name} host={a.host} />}</span>
            <div className="min-w-0 max-w-[80%] md:max-w-[65%]">
              {!grouped && (
                <p className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                  <span className="font-bold text-ink">{a.name}</span>
                  {a.host ? <Pill className="bg-ink px-2 py-0 text-[10px] text-white">Host</Pill> : null}
                  {a.detail && a.detail !== 'Host' && <span className="text-gray-500">{a.detail}</span>}
                  <span className="text-gray-400">· {format(parseISO(m.sentAt), 'HH:mm')}</span>
                </p>
              )}
              <div className="flex items-center gap-1">
                <p className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2 text-[15px]">{m.text}</p>
                <button
                  type="button"
                  title="Report message"
                  aria-label={`Report message from ${a.name}`}
                  onClick={() => {
                    dispatch({ type: 'reportMessage', messageId: m.id });
                    toast('Reported to the host and hidden for you');
                  }}
                  className="shrink-0 rounded-full p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-stone-100 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                >
                  <Flag className="size-3.5" />
                </button>
              </div>
            </div>
          </li>,
        ];
      })}
    </ol>
  );
}

function MembersPanel({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const { state } = useApp();
  const user = useCurrentUser()!;
  const dir = useDirectory();

  // Only list people whose "who can see I'm going" setting lets this viewer see them.
  const appMembers = state.chatMembers
    .filter((m) => m.eventId === event.id)
    .map((m) => state.users.find((u) => u.id === m.userId))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .filter((u) => u.id === user.id || u.role === 'organiser' || canSeeGoing(privacyOf(u).showGoing, u.standardCode, user));
  const people = peopleGoing(event).filter((p) => canSeeGoing(p.showGoing, p.standardCode, user));
  const listed = [
    resolveAuthor(`host:${event.organiserId}`, dir),
    ...appMembers.map((u) => resolveAuthor(u.id, dir)),
    ...people.map((p) => resolveAuthor(p.id, dir)),
  ];
  const others = Math.max(0, event.goingCount - people.length);

  return (
    <aside className="absolute inset-0 z-20 flex w-full flex-col border-l border-line bg-white md:static md:w-72">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-bold">People in this chat</p>
        <button type="button" onClick={onClose} className="btn-ghost px-2 text-xs">
          Close
        </button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {listed.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <Avatar id={a.id} name={a.name} host={a.host} size={30} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {a.me ? `${a.name} (you)` : a.name}
                {a.host && <span className="ml-1.5 text-xs font-semibold text-gray-500">Host</span>}
              </p>
              {a.detail && a.detail !== 'Host' && <p className="truncate text-xs text-gray-500">{a.detail}</p>}
            </div>
          </li>
        ))}
        {others > 0 && <li className="px-2 py-1.5 text-sm text-gray-500">and {others} more going</li>}
      </ul>
      <p className="border-t border-line p-4 text-xs leading-relaxed text-gray-500">
        People only see first names and last initials. Don't share phone numbers or addresses in group chats. Hosts can see
        everything posted here.
      </p>
    </aside>
  );
}
