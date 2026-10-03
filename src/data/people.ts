import type { EventItem, Person } from '../types';
import { standardOfKsb } from './standards';

// All fictional. These apprentices fill event group chats and "Who's going" lists so the demo
// feels populated; the friends feature will reuse them later.
const p = (
  id: string,
  name: string,
  standardCode: Person['standardCode'],
  employer: string,
  city: Person['city'],
  extra: Partial<Pick<Person, 'showGoing' | 'showEmployer'>> = {},
): Person => ({ id, name, standardCode, employer, city, showGoing: 'everyone', showEmployer: true, ...extra });

export const PEOPLE: Person[] = [
  // London
  p('p-amara', 'Amara Okoye', 'ST0119', 'Brightwire Software', 'London'),
  p('p-tom', 'Tom Fletcher', 'ST0119', 'Arclight Digital', 'London'),
  p('p-zara', 'Zara Hussain', 'ST0472', 'Northline Bank', 'London'),
  p('p-liam', 'Liam Doyle', 'ST0411', 'Harbourside Council', 'London'),
  p('p-mei', 'Mei Chen', 'ST0119', 'Kestrel Insurance', 'London'),
  p('p-josh', 'Josh Bennett', 'ST0472', 'Kestrel Insurance', 'London'),
  p('p-ella', 'Ella Martins', 'ST0411', 'Meridian Health Tech', 'London'),
  p('p-kwame', 'Kwame Asante', 'ST0119', 'Northline Bank', 'London'),
  p('p-sofia', 'Sofia Rossi', 'ST0472', 'Northline Bank', 'London', { showEmployer: false }),
  p('p-ryan', 'Ryan Patel', 'ST0411', 'Arclight Digital', 'London'),
  p('p-hannah', 'Hannah Wright', 'ST0119', 'Meridian Health Tech', 'London', { showGoing: 'coursemates' }),
  p('p-dev', 'Dev Sharma', 'ST0472', 'Harbourside Council', 'London'),
  // Manchester
  p('p-chloe', 'Chloe Barnes', 'ST0411', 'Buildright Projects', 'Manchester'),
  p('p-yusuf', 'Yusuf Ali', 'ST0119', 'Irwell Digital', 'Manchester'),
  p('p-grace', 'Grace Murphy', 'ST0472', 'Northline Bank', 'Manchester'),
  p('p-ben', 'Ben Hargreaves', 'ST0411', 'Pennine Energy', 'Manchester'),
  p('p-niamh', 'Niamh Kelly', 'ST0119', 'Canalside Media', 'Manchester'),
  p('p-omar', 'Omar Farouk', 'ST0472', 'Pennine Energy', 'Manchester'),
  p('p-jess', 'Jess Taylor', 'ST0411', 'Irwell Digital', 'Manchester'),
  p('p-arjun', 'Arjun Mehta', 'ST0119', 'Northline Bank', 'Manchester'),
  p('p-lucy', 'Lucy Evans', 'ST0472', 'Canalside Media', 'Manchester'),
  p('p-kai', 'Kai Thompson', 'ST0411', 'Buildright Projects', 'Manchester', { showEmployer: false }),
  p('p-fatima', 'Fatima Begum', 'ST0119', 'Pennine Energy', 'Manchester'),
  p('p-jack', 'Jack Robinson', 'ST0472', 'Irwell Digital', 'Manchester'),
];

const PEOPLE_BY_ID = new Map(PEOPLE.map((x) => [x.id, x]));
export const getPerson = (id: string) => PEOPLE_BY_ID.get(id);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const rotate = <T,>(xs: T[], seed: number) => {
  if (xs.length === 0) return xs;
  const k = seed % xs.length;
  return [...xs.slice(k), ...xs.slice(0, k)];
};

/**
 * The named seeded people going to an event (a stable subset of its goingCount): same city,
 * preferring apprentices on standards the event is tagged for. Brand-new events have nobody yet.
 */
export function peopleGoing(e: EventItem): Person[] {
  if (e.goingCount === 0) return [];
  const inCity = PEOPLE.filter((x) => x.city === e.city);
  const stds = new Set(e.ksbs.map(standardOfKsb));
  const preferred = stds.size ? inCity.filter((x) => stds.has(x.standardCode)) : inCity;
  const rest = inCity.filter((x) => !preferred.includes(x));
  const n = Math.min(inCity.length, Math.max(3, Math.min(7, Math.round(e.goingCount / 7))));
  const seed = hash(e.id);
  return [...rotate(preferred, seed), ...rotate(rest, seed)].slice(0, n);
}
