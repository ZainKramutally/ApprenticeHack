export type StandardCode = 'ST0119' | 'ST0411' | 'ST0472';
export type KsbType = 'K' | 'S' | 'B';

export interface Ksb {
  id: string; // "ST0411-K9"
  code: string; // "K9"
  type: KsbType;
  text: string; // short wording
  pathway?: string; // set only for option-specific KSBs
}

export interface Standard {
  code: StandardCode;
  title: string;
  shortName: string; // chip label
  level: number;
  minOtjHours: number;
  typicalDurationMonths: number;
  pathways: string[];
  ksbs: Ksb[];
}

export type City = 'London' | 'Manchester';
export type OrganiserType = 'employer' | 'provider' | 'uni' | 'apprentice';
export interface Organiser {
  id: string;
  name: string;
  type: OrganiserType;
  cities: City[];
}

export type Category = 'workshop' | 'hackathon' | 'networking' | 'music' | 'hangout';

export interface EventItem {
  id: string;
  title: string;
  category: Category;
  organiserId: string;
  city: City;
  area: string;
  venue: string;
  lat: number;
  lng: number;
  dayOffset: number; // days from today; negative = past
  /** Absolute ISO date (yyyy-MM-dd). Set on organiser-created events; wins over dayOffset. */
  date?: string;
  start: string; // "HH:mm"
  durationHours: number;
  inWorkingHours: boolean;
  ageRestricted18: boolean;
  capacity: number;
  goingCount: number;
  ksbs: string[]; // Ksb ids, may span standards
  description: string;
}

export interface Apprentice {
  id: string;
  role: 'apprentice';
  name: string;
  email: string;
  dob: string; // ISO date
  standardCode: StandardCode;
  pathway: string;
  provider: string;
  city: City;
  otjTargetHours: number;
  otjLoggedHours: number; // baseline from before the app
  gatewayDate: string; // ISO date
  signedOff: string[]; // Ksb ids
  coachFocus: string[]; // Ksb ids, max 3
}

export interface OrganiserUser {
  id: string;
  role: 'organiser';
  name: string;
  email: string;
  dob: string;
  organiserId: string;
}

export type User = Apprentice | OrganiserUser;

export interface Attendance {
  userId: string;
  eventId: string;
  hours: number;
  notes: string; // what I did and learned
  apply: string; // how I'll use it at work
  markedAt: string; // ISO
}

export interface AppState {
  currentUserId: string | null;
  users: User[];
  rsvps: { userId: string; eventId: string }[];
  favourites: { userId: string; eventId: string }[];
  attendance: Attendance[];
  customEvents: EventItem[];
  /** Organisations created by organisers who sign up through onboarding. */
  customOrganisers: Organiser[];
}
