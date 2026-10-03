import type { Apprentice, OrganiserUser } from '../types';

// All fictional.
const ids = (std: string, codes: string[]) => codes.map((c) => `${std}-${c}`);

export const SAM: Apprentice = {
  id: 'u-sam',
  role: 'apprentice',
  name: 'Sam Okafor',
  email: 'sam.okafor@thamestech.ac.uk',
  dob: '2004-03-12',
  standardCode: 'ST0119',
  pathway: 'Software engineering professional',
  provider: 'Thames Tech Training',
  city: 'London',
  otjTargetHours: 1022,
  otjLoggedHours: 410,
  gatewayDate: '2028-06-30',
  signedOff: ids('ST0119', ['K1', 'K2', 'K5', 'S6', 'B5']),
  coachFocus: ids('ST0119', ['K11', 'S8']),
};

export const AISHA: Apprentice = {
  id: 'u-aisha',
  role: 'apprentice',
  name: 'Aisha Rahman',
  email: 'aisha.rahman@buildright.co.uk',
  dob: '2001-09-02',
  standardCode: 'ST0411',
  pathway: 'Core',
  provider: 'Mancunian University Apprenticeships',
  city: 'Manchester',
  otjTargetHours: 974,
  otjLoggedHours: 300,
  gatewayDate: '2029-03-31',
  signedOff: ids('ST0411', ['K2', 'K3', 'S2', 'B2', 'B5']),
  coachFocus: ids('ST0411', ['K9', 'S5']),
};

export const PRIYA: Apprentice = {
  id: 'u-priya',
  role: 'apprentice',
  name: 'Priya Shah',
  email: 'priya.shah@northlinebank.co.uk',
  dob: '2003-01-20',
  standardCode: 'ST0472',
  pathway: 'Operations',
  provider: 'City Project Academy',
  city: 'London',
  otjTargetHours: 696,
  otjLoggedHours: 250,
  gatewayDate: '2028-09-30',
  signedOff: ids('ST0472', ['K1', 'K3', 'K5', 'S1', 'S2', 'B1']),
  coachFocus: ids('ST0472', ['K2', 'S4']),
};

export const JORDAN: OrganiserUser = {
  id: 'u-jordan',
  role: 'organiser',
  name: 'Jordan Lee',
  email: 'jordan.lee@northlinebank.co.uk',
  dob: '1994-05-08',
  organiserId: 'org-northline',
};

export const PERSONAS = [SAM, AISHA, PRIYA, JORDAN];

export const PERSONA_SHORTCUTS: { userId: string; label: string }[] = [
  { userId: 'u-sam', label: 'Continue as Sam (DTSP, London)' },
  { userId: 'u-aisha', label: 'Continue as Aisha (Project manager, Manchester)' },
  { userId: 'u-priya', label: 'Continue as Priya (Financial services, London)' },
  { userId: 'u-jordan', label: 'Continue as Jordan (organiser, Northline Bank)' },
];

export const SEED_RSVPS: { userId: string; eventId: string }[] = [
  { userId: 'u-sam', eventId: 'ldn-threat-past' },
  { userId: 'u-sam', eventId: 'ldn-quiz-past' },
  { userId: 'u-sam', eventId: 'ldn-bowling' },
  { userId: 'u-aisha', eventId: 'man-raid-past' },
  { userId: 'u-aisha', eventId: 'man-nq-social' },
  { userId: 'u-priya', eventId: 'ldn-regs-past' },
  { userId: 'u-priya', eventId: 'ldn-quiz-past' },
];

export const SEED_FAVOURITES: { userId: string; eventId: string }[] = [
  { userId: 'u-sam', eventId: 'ldn-fintech-hack' },
  { userId: 'u-aisha', eventId: 'man-budgets' },
  { userId: 'u-priya', eventId: 'ldn-consumer-duty' },
];
