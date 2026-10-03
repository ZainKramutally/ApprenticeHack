import { addHours, addMinutes, startOfDay, startOfToday } from 'date-fns';
import { endsAt, fmtTime, isUpcoming, startsAt } from '../lib/dates';
import type { Category, ChatMessage, EventItem, Person } from '../types';
import { peopleGoing } from './people';
import { getStandard } from './standards';

// Seeded group-chat history, generated from each event so the chats feel lived-in.
// `who` is 'host' (the organiser) or an index into peopleGoing(event).
interface Line {
  who: 'host' | number;
  h: number; // hours after the thread starts
  text: string;
}

const BEFORE: Record<Category, Line[]> = {
  workshop: [
    { who: 'host', h: 0, text: 'Hi everyone 👋 Welcome to the {title} chat. We start at {start} at {venue}; ask for the {host} team at reception.' },
    { who: 0, h: 3, text: 'Has anyone been to one of these before? Wondering how hands-on it is.' },
    { who: 'host', h: 4, text: "Very hands-on! You'll be doing exercises from the first ten minutes." },
    { who: 1, h: 9, text: 'Anyone fancy a coffee near {area} beforehand? I’ll be around from {meet}.' },
    { who: 2, h: 10, text: "I'm in ☕" },
  ],
  hackathon: [
    { who: 'host', h: 0, text: 'Welcome to {title}! Teams of 3–5, mixed courses encouraged. Doors open at {start} and lunch is on us.' },
    { who: 0, h: 3, text: "Looking for a team! I'm {course0} at {employer0}, happy to take the research and pitch side." },
    { who: 1, h: 5, text: 'I can code (mostly Python and a bit of React). Want to team up?' },
    { who: 0, h: 6, text: "Yes! Let's do it 🙌" },
    { who: 2, h: 9, text: "Room for one more? I'm {course2}, good with spreadsheets and numbers." },
  ],
  networking: [
    { who: 'host', h: 0, text: 'First drinks are on us. Look for the orange Off the Clock banner at {venue} from {start}.' },
    { who: 0, h: 4, text: 'First time coming to one of these, bit nervous 😅' },
    { who: 1, h: 5, text: "You'll be fine, everyone's really friendly. Come and say hi!" },
    { who: 2, h: 11, text: 'Anyone heading over from {area}? Could walk over together.' },
  ],
  music: [
    { who: 'host', h: 0, text: 'Doors at {start}. The performer sign-up sheet is at the bar.' },
    { who: 0, h: 3, text: 'Anyone else performing? I’m doing two acoustic songs 🎸' },
    { who: 1, h: 6, text: "Not brave enough yet, but I'll be cheering you on 🎶" },
  ],
  hangout: [
    { who: 'host', h: 0, text: "All abilities welcome! We'll mix up the teams so you meet new people. See you at {venue}." },
    { who: 0, h: 2, text: "Haven't done this in years, prepare for chaos 😂" },
    { who: 1, h: 4, text: 'Same here. Shall we aim to get there 10 minutes early?' },
    { who: 2, h: 8, text: 'Good shout, see you there 👋' },
  ],
};

// Posted after a past event finished (h = hours after it ended).
const AFTER: Partial<Record<Category, Line[]>> = {
  workshop: [
    { who: 0, h: 1, text: 'Thanks all, that was really useful. Happy to share my notes if anyone wants them.' },
    { who: 'host', h: 2, text: 'Thanks for coming! Slides are on their way by email.' },
  ],
  hackathon: [{ who: 1, h: 1, text: 'What a day. Great teaming up with you all 🙌' }],
  networking: [{ who: 1, h: 2, text: 'Great night, nice meeting everyone 👋' }],
};

export const hostAuthorId = (organiserId: string) => `host:${organiserId}`;

function fill(text: string, e: EventItem, hostName: string, people: Person[]): string {
  const meet = fmtTime(addMinutes(startsAt(e), -30));
  return text
    .replace('{title}', e.title)
    .replace('{start}', e.start)
    .replace('{venue}', e.venue)
    .replace('{area}', e.area)
    .replace('{host}', hostName)
    .replace('{meet}', meet)
    .replace('{course0}', people[0] ? getStandard(people[0].standardCode).shortName : '')
    .replace('{employer0}', people[0]?.employer ?? '')
    .replace('{course2}', people[2] ? getStandard(people[2].standardCode).shortName : '');
}

/** The seeded messages for one event's chat, oldest first. All timestamps are in the past. */
export function seedThread(e: EventItem, hostName: string): ChatMessage[] {
  const people = peopleGoing(e);
  if (people.length === 0) return []; // organiser-created events start empty
  const upcoming = isUpcoming(e);
  // Chatter starts at 09:00 the day before: yesterday for upcoming events, the day before a past
  // event (plus a couple of messages after it ended).
  const base = addHours(upcoming ? startOfToday() : startOfDay(startsAt(e)), -15);
  const toMsg = (line: Line, i: number, at: Date): ChatMessage | null => {
    const authorId = line.who === 'host' ? hostAuthorId(e.organiserId) : people[line.who]?.id;
    if (!authorId) return null;
    return { id: `seed:${e.id}:${i}`, eventId: e.id, authorId, text: fill(line.text, e, hostName, people), sentAt: at.toISOString() };
  };
  const before = BEFORE[e.category].map((l, i) => toMsg(l, i, addHours(base, l.h)));
  const after = upcoming ? [] : (AFTER[e.category] ?? []).map((l, i) => toMsg(l, 100 + i, addHours(endsAt(e), l.h)));
  const now = new Date().toISOString();
  return [...before, ...after].filter((m): m is ChatMessage => m !== null && m.sentAt <= now);
}
