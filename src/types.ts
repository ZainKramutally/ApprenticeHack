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
  employer?: string;
  city: City;
  otjTargetHours: number;
  otjLoggedHours: number; // baseline from before the app
  gatewayDate: string; // ISO date
  signedOff: string[]; // Ksb ids
  coachFocus: string[]; // Ksb ids, max 3
  privacy?: PrivacySettings; // defaults in lib/chat.ts
}

export interface OrganiserUser {
  id: string;
  role: 'organiser';
  name: string;
  email: string;
  dob: string;
  organiserId: string;
  privacy?: PrivacySettings;
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

export type GoingVisibility = 'everyone' | 'coursemates' | 'nobody';

export interface PrivacySettings {
  autoJoinChats: boolean; // RSVP adds you to the event's group chat (opt-out toggle at RSVP)
  showGoing: GoingVisibility; // who can see you in "Who's going" lists
  showEmployer: boolean; // employer shown next to your name in chats and lists
}

/** Fictional seeded apprentices who populate chats and attendee lists (and friends, later). */
export interface Person {
  id: string;
  name: string;
  standardCode: StandardCode;
  employer: string;
  city: City;
  showGoing: GoingVisibility;
  showEmployer: boolean;
}

export interface ChatMember {
  userId: string;
  eventId: string;
  joinedAt: string; // ISO
  lastReadAt?: string; // ISO; unset = nothing read yet
  muted?: boolean;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  /** A user id, a seeded person id, `host:{organiserId}`, or 'system'. */
  authorId: string;
  text: string;
  sentAt: string; // ISO
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
  /** Event group-chat membership for app users (apprentices and hosts). */
  chatMembers: ChatMember[];
  /** Messages posted in this browser (seeded threads are generated from code, see data/chatSeed.ts). */
  messages: ChatMessage[];
  /** Messages a user reported, hidden for that user. */
  hiddenMessages: { userId: string; messageId: string }[];
}
