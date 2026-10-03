# Off the Clock: Build Spec

> **Repo status:** the MVP described below is built (Vite + React + TS in `src/`). Extend and fix it; don't re-scaffold. Run with `npm install` then `npm run dev`; check with `npm run typecheck` and `npm run build`. Section 11's demo script is the acceptance test, so walk through it after changing anything in `src/lib/`. Implementation notes and deviations from this spec are in [Section 14](#14-implementation-notes); the group chat, privacy and map decisions made after the first build are in [Section 15](#15-group-chat-and-privacy-added-after-the-mvp). The presenter run-sheet and code tour are in `GUIDE.md`.

> **Prompt for the coding agent:** You are building a clickable front-end demo of *Off the Clock*, an events app for UK apprentices. Read this whole spec first, then build in the order in [Section 12](#12-build-order). Make sensible choices instead of asking questions. There is no backend: all data is seeded from the files in [Section 10](#10-seed-data) and persisted in `localStorage`. The demo is presented live in under 3 hours, so the P0 loop in [Section 11](#11-demo-script-acceptance-test) must work end to end before anything else is polished.

---

## 1. Product in one paragraph

Off the Clock is a Luma-style events app only for apprentices. It lists socials (drinks, music, bowling, football, paintballing) and professional events (workshops, hackathons). Its USP flips the usual order: instead of going to events and then mapping them to KSBs (knowledge, skills and behaviours from the apprenticeship standard), the apprentice tells us their standard and what they've already had signed off, and we recommend events that fill their KSB gaps. After attending, they generate a report (off-the-job (OTJ) log entry, KSB evidence write-up, progress summary, PDF and CSV) ready to paste or upload into OneFile or Aptem. Free to use.

**Tagline:** "Meet other apprentices. Close your KSB gaps."

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Build | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS, Inter font (Google Fonts) |
| Routing | react-router-dom v6 |
| Map | react-leaflet + Leaflet; basemap is OpenFreeMap **Positron** vector tiles (free, no key) via `maplibre-gl` + `@maplibre/maplibre-gl-leaflet` (see Section 15) |
| Icons | lucide-react |
| Dates | date-fns |
| State | React context + `useReducer`, persisted to `localStorage` key `otc:v1` |
| PDF | Browser print (`window.print()`) with a print stylesheet |
| CSV | Built in the browser, downloaded via a Blob link |

**Runs locally** with `npm install` then `npm run dev`. Map tiles need internet, so the map must degrade gracefully: if tiles fail to load, pins still show on Leaflet's plain background and nothing else breaks. Add a short `README.md` with the run commands and the demo script from Section 11.

Suggested structure:

```
src/
  data/standards.ts  data/organisers.ts  data/events.ts  data/personas.ts
  lib/score.ts  lib/report.ts  lib/storage.ts  lib/dates.ts  lib/email.ts
  context/AppState.tsx
  components/Sidebar.tsx  EventCard.tsx  EventMap.tsx  FilterChips.tsx  Badge.tsx  KsbList.tsx  AttendModal.tsx  StatTile.tsx
  pages/Welcome.tsx  Onboarding.tsx  Discover.tsx  EventPage.tsx  Search.tsx  Favourites.tsx  Profile.tsx  Report.tsx  CreateEvent.tsx
```

---

## 3. Domain rules (must be enforced)

1. **OTJ only counts in working hours.** Every event has `inWorkingHours: boolean`. Only attended events with `inWorkingHours === true` add OTJ hours, appear as OTJ log entries, count as KSB evidence and can score in recommendations. (UK funding rules: off-the-job training must happen in normal working hours and build the standard's KSBs.)
2. **Badges on every event card and page:**
   - `inWorkingHours && ksbs.length > 0` → green badge **"Counts towards OTJ"**
   - otherwise → grey badge **"Social only"**
   - `ageRestricted18` → small **"18+"** badge
3. **Under-18s:** compute age from `dob`. If under 18, hide every event with `ageRestricted18 === true` everywhere (map, lists, search, recommendations).
4. **Apprentice-only sign-up:** reject personal email domains (see `lib/email.ts` in Section 10). Domains ending `.ac.uk` or in the known-organisations list get a **"Verified"** tick; any other non-personal domain is accepted without the tick.
5. **Only employer, provider and uni organisers can tag KSBs.** Apprentice organisers can post socials only; the KSB picker is hidden for them.
6. **Attendance is self-declared.** The report carries the line: *"Attendance is self-declared. Check with your skills coach before submitting."*
7. **KSB codes:** IDs are `"{standardCode}-{code}"`, e.g. `"ST0411-K9"`. Display only the code part (`K9`) plus its text.

---

## 4. Layout and navigation

- **Desktop:** fixed left icon rail (72px). Top: logo mark (a clock face with a small tick) and wordmark on hover. Icons, top to bottom: Discover (`Compass`), Search (`Search`), Chats (`MessageCircle`, with an unread badge), Favourites (`Heart`), Profile (`User`). Organisers also get Create (`PlusCircle`). Active item: filled accent background.
- **Mobile (< 768px):** same items as a bottom tab bar.
- **Routes:**

| Route | Page | Notes |
| --- | --- | --- |
| `/welcome` | Welcome | Shown when no current user |
| `/onboarding` | Sign-up + baseline | 3 steps |
| `/` | Discover | Home |
| `/event/:id` | Event page | |
| `/search` | Search | |
| `/chats` | Chats list | Section 15 |
| `/chats/:eventId` | Event group chat | Section 15 |
| `/favourites` | Favourites | |
| `/profile` | Profile + KSB tracker | |
| `/report` | Report generator | |
| `/create` | Create event | Organisers only |

### Visual style

Clean, Luma-like: off-white background, white rounded cards (`rounded-2xl`, soft border, no heavy shadows), generous spacing, bold titles.

| Token | Value |
| --- | --- |
| Ink | `#111827` |
| Background | `#FAFAF9` |
| Accent (brand) | `#F97316` orange |
| OTJ badge | `#16A34A` green on `#DCFCE7` |
| Social badge | `#4B5563` on `#F3F4F6` |
| Workshop | `#2563EB` (icon `Presentation`) |
| Hackathon | `#7C3AED` (icon `Code2`) |
| Networking & drinks | `#D97706` (icon `Wine`) |
| Music | `#DB2777` (icon `Music`) |
| Hangout | `#0D9488` (icon `Users`) |

Event cards: a 96px cover band with a gradient in the category colour and its white icon, then date ("Thu 8 Oct · 10:00"), title, area + city, organiser, badges, and a heart button top-right.

---

## 5. Screens

### 5.1 Welcome (`/welcome`)
- Logo, tagline, one-line pitch.
- **Get started** → `/onboarding`.
- **Demo shortcuts** (presenter use): "Continue as Sam (DTSP, London)", "Continue as Aisha (Project manager, Manchester)", "Continue as Priya (Financial services, London)", "Continue as Jordan (organiser, Northline Bank)". Each loads the persona from seed and goes to `/`.

### 5.2 Onboarding (`/onboarding`), 3 steps with a progress bar
1. **Account:** full name, email (validated by rule 4, inline error: "Use your training provider, uni or employer email"), date of birth, role toggle **Apprentice / Organiser**.
   - Organiser extra fields: organisation name, organisation type (**Employer / Training provider / University / Apprentice-run group**), city.
2. **Your apprenticeship** (apprentices only): standard (select of the 3 in seed), pathway/option (from the standard's `pathways`), training provider name, city (**London / Manchester**).
3. **Your baseline** (apprentices only):
   - OTJ target hours (prefilled from the standard's `minOtjHours`, editable)
   - OTJ hours logged so far (number)
   - Gateway date (date)
   - KSB checklist grouped Knowledge / Skills / Behaviours: tick the ones **already signed off**
   - Coach's focus KSBs: pick up to 3 from the unticked ones
   - **Finish** → `/`.

### 5.3 Discover (`/`), the home screen
Order (from the sketch):
1. **Map** (~45vh, full width). Centred on the selected city (London `51.5074, -0.1278`; Manchester `53.4808, -2.2426`), zoom 12. Each event is a round pin in its category colour with its icon (Leaflet `divIcon`). Clicking a pin opens a popup mini-card (title, date, badge, **View** link).
2. **Filter chips** (sticky under the map), three rows:
   - Course (single select, default = user's standard): **Project Management** (ST0411), **DTSP** (ST0119), **Finance** (ST0472)
   - City (single select, default = user's city): **London**, **Manchester**
   - Type (multi-select, none = all): **KSBs** (events with at least one KSB tag for the selected course), **Workshops**, **Hackathons**, **Networking**, **Music**, **Hangouts**
3. **"Recommended for your KSBs"**: horizontal scroll of up to 5 cards with `score > 0` (Section 7), each showing "Covers 2 of your gaps: K11, S8" and a **Coach focus** tag where relevant. Empty state: "You're on track. Check back for new events."
4. **"10 events nearby"**: next 10 upcoming events in the selected city after filters, as a card grid (2 columns desktop, 1 mobile).

Map and lists use the same filtered set. Past events never appear on Discover.

### 5.4 Event page (`/event/:id`)
- Cover band (category colour + icon), title, date and time range, venue + area + city, small static map.
- Organiser name with type badge (**Employer / Provider / University / Apprentice-run**).
- Badges: OTJ or Social, 18+.
- Description.
- **KSBs covered**, grouped by standard with the user's standard first. Each row shows code + text and a status pill for the current user: **Coach focus** (accent), **You need this** (blue), **Evidenced, awaiting sign-off** (amber), **Signed off** (muted grey). Other standards' KSBs collapsed under "Also relevant to: Project manager, Financial services professional".
- "{goingCount} apprentices going" (+ P1: "{n} from your course").
- Actions:
  - Upcoming: **RSVP** toggle (Going ✓) and **Heart**.
  - Past + RSVP'd + not yet attended: **Mark "I went"** → Attend modal.
  - Attended: "Attended ✓ · included in your report" and **Edit notes**.

### 5.5 Attend modal
Fields: hours (default = event duration, max = duration, hidden for social events), **What did you do and learn?** (textarea, required, min 20 chars), **How will you use it at work?** (textarea, optional). For social-only events show: "Social events don't add OTJ hours. Your notes are saved for your own record." Save → status `went`, toast "Added to your report", OTJ hours and KSB statuses update immediately.

### 5.6 Search (`/search`)
Text box (matches title, description, organiser, area), the same three chip rows, and a date filter (**This week / This month / Any time**). Results as cards, upcoming first; toggle "Include past events".

### 5.7 Favourites (`/favourites`)
Hearted events, upcoming first, past ones greyed. Empty state with a link to Discover.

### 5.8 Profile and KSB tracker (`/profile`)
- Header: name, standard + level + pathway, provider, city, Verified tick, **Edit baseline** (reopens step 3 of onboarding).
- Four stat tiles:
  - **KSBs signed off**: `signed / total` with a progress ring
  - **Evidenced, awaiting sign-off**: count
  - **OTJ hours**: `(baseline logged + attended working-hours hours) / target`, progress bar, % label
  - **Days to gateway**
- **Coach's focus**: each focus KSB with its status.
- **KSB checklist**: tabs Knowledge / Skills / Behaviours, each row with status pill; clicking toggles "signed off" (so the presenter can adjust live).
- **My events**: tabs **Upcoming** (RSVP'd), **To confirm** (past + RSVP'd + not attended, each with a **Mark "I went"** button), **Attended**.
- Primary button **Generate report** → `/report`.
- Footer (small): **Switch demo persona**, **Reset demo data** (clears `localStorage` and reloads seed).

### 5.9 Report (`/report`)
- Controls: date range (default: last 3 months), checklist of attended events (default all working-hours ones ticked).
- Four sections, each with a **Copy** button that copies plain text:
  1. **OTJ log entries**, one per selected working-hours event (format in Section 8).
  2. **KSB evidence write-ups**, one per KSB evidenced (Section 8).
  3. **Progress summary** (Section 8).
  4. **Other events attended**: one line per social event ("Bowling Night, Bloomsbury, 8 Oct"), not counted as OTJ.
- Buttons: **Download CSV**, **Download PDF** (calls `window.print()`).
- Footer line: the self-declared disclaimer from rule 6.
- Print stylesheet: hide sidebar, controls and buttons; A4; header "Off the Clock · Evidence report · {name} · {standard title} · generated {date}".

### 5.10 Create event (`/create`, organisers only)
Fields: title, category, description, city, area/venue, location (click the map to drop a pin; default city centre), date, start time, duration (hours), **In working hours** toggle (auto-on for Mon–Fri starts between 09:00 and 16:00, still editable), **18+** toggle (auto-on for Networking and Music), capacity, and **KSB tags**: pick one or more standards, then tick KSBs (hidden for Apprentice-run groups). **Publish** saves to `customEvents` in state, toast "Your event is live", redirect to its event page. It must then show on the map and in matching apprentices' recommendations.

---

## 6. Data model

```ts
export type StandardCode = 'ST0119' | 'ST0411' | 'ST0472';
export type KsbType = 'K' | 'S' | 'B';

export interface Ksb {
  id: string;            // "ST0411-K9"
  code: string;          // "K9"
  type: KsbType;
  text: string;          // short wording
  pathway?: string;      // set only for option-specific KSBs
}

export interface Standard {
  code: StandardCode;
  title: string;
  shortName: string;     // chip label
  level: number;
  minOtjHours: number;
  typicalDurationMonths: number;
  pathways: string[];
  ksbs: Ksb[];
}

export type OrganiserType = 'employer' | 'provider' | 'uni' | 'apprentice';
export interface Organiser { id: string; name: string; type: OrganiserType; cities: City[]; }

export type City = 'London' | 'Manchester';
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
  dayOffset: number;     // days from today; negative = past
  start: string;         // "HH:mm"
  durationHours: number;
  inWorkingHours: boolean;
  ageRestricted18: boolean;
  capacity: number;
  goingCount: number;
  ksbs: string[];        // Ksb ids, may span standards
  description: string;
}

export interface Apprentice {
  id: string;
  role: 'apprentice';
  name: string;
  email: string;
  dob: string;           // ISO date
  standardCode: StandardCode;
  pathway: string;
  provider: string;
  city: City;
  otjTargetHours: number;
  otjLoggedHours: number; // baseline from before the app
  gatewayDate: string;    // ISO date
  signedOff: string[];    // Ksb ids
  coachFocus: string[];   // Ksb ids, max 3
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
  notes: string;          // what I did and learned
  apply: string;          // how I'll use it at work
  markedAt: string;       // ISO
}

export interface AppState {
  currentUserId: string | null;
  users: User[];
  rsvps: { userId: string; eventId: string }[];
  favourites: { userId: string; eventId: string }[];
  attendance: Attendance[];
  customEvents: EventItem[];
}
```

Resolve `dayOffset` + `start` to a real `Date` at runtime (`startOfToday() + dayOffset days + HH:mm`) so the demo always looks current.

Derived per apprentice:
- `evidenced` = KSB ids of the user's standard tagged on attended working-hours events, minus `signedOff`.
- `gaps` = KSBs of the user's standard (core + their pathway) not in `signedOff` and not in `evidenced`.
- `otjTotal` = `otjLoggedHours` + sum of `attendance.hours` for working-hours events.

---

## 7. Recommendation score

```ts
// lib/score.ts
export function scoreEvent(e: EventItem, u: Apprentice, gaps: Set<string>, now: Date): number {
  if (!e.inWorkingHours) return 0;
  if (startsAt(e) <= now) return 0;
  let score = 0;
  for (const id of e.ksbs) {
    if (!gaps.has(id)) continue;
    score += u.coachFocus.includes(id) ? 2 : 1;
  }
  // P2 stretch: gateway boost
  // if (daysUntil(u.gatewayDate) < 180) score *= 1.5;
  return score;
}
// Recommended strip: filter by selected city + under-18 rule, score > 0,
// sort by score desc, then by start date asc, take 5.
// Card subtitle: "Covers {n} of your gaps: {codes}".
```

---

## 8. Report formats

**OTJ log entry** (plain text, one per event; fields mirror Aptem's activity log: activity type, date and duration, working-hours indicator, description):

```
Date: 27 Sep 2026
Start time: 10:00
Duration: 3 hours
Activity type: Workshop / training session
In working hours: Yes
Event: Threat Modelling 101, Thames Tech Training, Shoreditch, London
Description: {event.description first sentence} {attendance.notes}
KSBs evidenced: K11 Common vulnerabilities in digital solutions; S8 Apply security and resilience techniques
```

Activity type mapping: `workshop` → "Workshop / training session", `hackathon` → "Competition / hackathon". Only working-hours events produce entries.

**KSB evidence write-up** (one per evidenced KSB, grouped if several events evidence it):

```
K11 Common vulnerabilities in digital solutions
What I did: Attended Threat Modelling 101 (Thames Tech Training, 27 Sep 2026, 3 hours). {event.description}
What I learned: {attendance.notes}
How I'll apply it at work: {attendance.apply or "To discuss with my skills coach."}
```

**Progress summary:**

```
Off the Clock progress summary for Sam Okafor
Standard: Digital and technology solutions professional (Level 6), Software engineering professional
KSBs signed off: 5 of 15
Evidenced through events, awaiting sign-off: 3 (K3, K11, S8)
Still to evidence: 7 (K4, K13, S1, S3, S5, S9, B6)
Coach focus: K11 evidenced, S8 evidenced
OTJ hours: 413 of 1,022 (40%)
Gateway: 30 Jun 2028 (636 days)
Next recommended events: Fintech for Good Hackathon (12 Oct), ...
```

**CSV columns:** `date,start_time,duration_hours,activity_type,in_working_hours,event_title,organiser,location,ksb_codes,ksb_texts,what_i_did_and_learned,how_i_will_apply` (one row per working-hours event; quote every field; filename `off-the-clock-report-{yyyy-mm-dd}.csv`).

---

## 9. Persistence

- On first load, if `localStorage['otc:v1']` is missing or unparsable, build state from seed (personas, their RSVPs and favourites). Wrap every read/write in `try/catch`.
- Every state change writes the whole state back.
- **Reset demo data** clears the key and reloads.

---

## 10. Seed data

> KSB wording is shortened from the Skills England standards. ST0411 and ST0472 codes follow the order in the Skills England API. ST0119 (DTSP) has no published codes in the API, so its codes are demo labels; check all codes against your provider's KSB matrix before real use.

### 10.1 Standards (`data/standards.ts`)

```ts
const k = (std: string, code: string, text: string, pathway?: string): Ksb =>
  ({ id: `${std}-${code}`, code, type: code[0] as KsbType, text, pathway });

export const STANDARDS: Standard[] = [
  {
    code: 'ST0119', title: 'Digital and technology solutions professional', shortName: 'DTSP',
    level: 6, minOtjHours: 1022, typicalDurationMonths: 48,
    pathways: ['Software engineering professional', 'IT consultant professional', 'Business analyst professional',
               'Cyber security professional', 'Computing data analyst professional', 'Network engineering professional'],
    ksbs: [
      k('ST0119','K1','How organisations use digital technology for competitive advantage'),
      k('ST0119','K2','Strategic decisions on buying or building solutions'),
      k('ST0119','K3','Estimating risks and opportunities'),
      k('ST0119','K4','Business case techniques'),
      k('ST0119','K5','Solution development techniques and tools'),
      k('ST0119','K11','Common vulnerabilities in digital solutions'),
      k('ST0119','K13','Data analysis principles'),
      k('ST0119','S1','Analyse a business problem to find the role of digital solutions'),
      k('ST0119','S3','Specify the right digital solution for a business problem'),
      k('ST0119','S5','Manage digital and technology projects'),
      k('ST0119','S6','Work in teams, leading where appropriate'),
      k('ST0119','S8','Apply security and resilience techniques'),
      k('ST0119','S9','Report effectively to colleagues and stakeholders'),
      k('ST0119','B5','Interact professionally with technical and non-technical people'),
      k('ST0119','B6','Share best practice in the organisation and community'),
    ],
  },
  {
    code: 'ST0411', title: 'Project manager (integrated degree)', shortName: 'Project Management',
    level: 6, minOtjHours: 974, typicalDurationMonths: 48,
    pathways: ['Core'],
    ksbs: [
      k('ST0411','K1','Governance and financial control of projects'),
      k('ST0411','K2','The business environment'),
      k('ST0411','K3','Stakeholder and communications management'),
      k('ST0411','K4','Organisational change management'),
      k('ST0411','K5','Estimating, planning and scheduling'),
      k('ST0411','K6','Project justification and benefits'),
      k('ST0411','K7','Quality management'),
      k('ST0411','K8','Procurement and contract management'),
      k('ST0411','K9','Risk management'),
      k('ST0411','K10','Project change control'),
      k('ST0411','K11','Organisational strategy'),
      k('ST0411','S1','Lead governance frameworks and project plans'),
      k('ST0411','S2','Analyse the business environment'),
      k('ST0411','S3','Lead stakeholder and communications management'),
      k('ST0411','S4','Control projects on time, cost and quality'),
      k('ST0411','S5','Manage risks, opportunities and issues'),
      k('ST0411','S6','Choose commercial and contract options'),
      k('ST0411','S7','Apply project change control'),
      k('ST0411','S8','Manage schedules and resources'),
      k('ST0411','B1','Leadership'),
      k('ST0411','B2','Collaboration and teamwork'),
      k('ST0411','B3','Personal and professional responsibility'),
      k('ST0411','B4','Integrity, ethics and professionalism'),
      k('ST0411','B5','Inclusive'),
      k('ST0411','B6','Innovation and resourcefulness'),
    ],
  },
  {
    code: 'ST0472', title: 'Financial services professional', shortName: 'Finance',
    level: 6, minOtjHours: 696, typicalDurationMonths: 42,
    pathways: ['Retail banking', 'Commercial/business banking', 'Investment banking',
               'Investment management', 'Operations', 'Workplace pensions'],
    ksbs: [
      k('ST0472','K1','Financial services industry structure and environment'),
      k('ST0472','K2','Legal, regulatory, compliance and risk frameworks'),
      k('ST0472','K3','Financial products and services'),
      k('ST0472','K4','Client segments, channels and fair customer outcomes'),
      k('ST0472','K5','Organisational policies, systems and tools'),
      k('ST0472','K18','Process and project management principles','Operations'),
      k('ST0472','K19','Controls in own area of work','Operations'),
      k('ST0472','K20','Operational risk and control methods','Operations'),
      k('ST0472','K21','Market practices affecting own area','Operations'),
      k('ST0472','S1','Build ethical, trusted client relationships'),
      k('ST0472','S2','Use systems and processes within policy and regulation'),
      k('ST0472','S3','Contribute to planning and manage progress'),
      k('ST0472','S4','Evaluate information and make effective decisions'),
      k('ST0472','S5','Communicate complex information clearly'),
      k('ST0472','S6','Build working relationships and collaborate'),
      k('ST0472','S7','Find and lead performance improvements'),
      k('ST0472','S8','Keep up with legal and regulatory change; support others'),
      k('ST0472','S22','Lead small teams delivering regulated service','Operations'),
      k('ST0472','S23','Apply project management and control frameworks','Operations'),
      k('ST0472','B1','Honesty, integrity and confidentiality'),
      k('ST0472','B2','Adaptable to changing priorities'),
      k('ST0472','B3','Energy, determination and resilience'),
      k('ST0472','B4','Curiosity and innovation within regulation'),
      k('ST0472','B5','Thorough, accurate, owns the quality of work'),
    ],
  },
];
// A user's KSB list = standard.ksbs where !pathway || pathway === user.pathway
```

### 10.2 Organisers (`data/organisers.ts`), all fictional

```ts
export const ORGANISERS: Organiser[] = [
  { id: 'org-thames',     name: 'Thames Tech Training',               type: 'provider',   cities: ['London'] },
  { id: 'org-citypm',     name: 'City Project Academy',               type: 'provider',   cities: ['London'] },
  { id: 'org-northline',  name: 'Northline Bank',                     type: 'employer',   cities: ['London', 'Manchester'] },
  { id: 'org-buildright', name: 'Buildright Projects',                type: 'employer',   cities: ['Manchester'] },
  { id: 'org-mancunian',  name: 'Mancunian University Apprenticeships', type: 'uni',      cities: ['Manchester'] },
  { id: 'org-collective', name: 'Apprentice Collective',              type: 'apprentice', cities: ['London', 'Manchester'] },
];
```

### 10.3 Events (`data/events.ts`)

20 upcoming (10 per city) + 4 past events used by the personas. Write a one- or two-sentence `description` for each in a friendly, specific tone.

| id | title | cat | organiser | city · area | lat, lng | day | start | hrs | WH | 18+ | cap / going | ksbs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ldn-cloud-lab | Cloud Security Lab | workshop | org-thames | London · Shoreditch | 51.5265, -0.0786 | +3 | 10:00 | 3 | Y | N | 30 / 18 | ST0119-K11, ST0119-S8, ST0119-K5 |
| ldn-agile | Agile Delivery in Practice | workshop | org-citypm | London · Canary Wharf | 51.5054, -0.0235 | +4 | 13:00 | 3 | Y | N | 40 / 22 | ST0411-K5, ST0411-S8, ST0411-K10, ST0119-S5 |
| ldn-risk | Risk Registers that Actually Work | workshop | org-northline | London · Bank | 51.5133, -0.0890 | +6 | 09:30 | 3 | Y | N | 35 / 19 | ST0411-K9, ST0411-S5, ST0472-K2, ST0472-S4, ST0119-K3 |
| ldn-fintech-hack | Fintech for Good Hackathon | hackathon | org-northline | London · King's Cross | 51.5320, -0.1240 | +9 | 09:00 | 7 | Y | N | 80 / 54 | ST0119-S1, ST0119-S3, ST0119-S6, ST0472-K3, ST0472-S5, ST0472-B4, ST0411-B6 |
| ldn-present | Presenting to Senior Stakeholders | workshop | org-citypm | London · Holborn | 51.5174, -0.1200 | +11 | 14:00 | 2 | Y | N | 25 / 12 | ST0411-K3, ST0411-S3, ST0411-B1, ST0472-S5, ST0119-S9, ST0119-B5 |
| ldn-consumer-duty | Consumer Duty Explained | workshop | org-northline | London · Canary Wharf | 51.5049, -0.0195 | +14 | 10:00 | 2 | Y | N | 40 / 15 | ST0472-K2, ST0472-K4, ST0472-S8, ST0472-B1 |
| ldn-drinks | Apprentice Drinks on the South Bank | networking | org-collective | London · South Bank | 51.5055, -0.1160 | +2 | 18:30 | 3 | N | Y | 60 / 41 | |
| ldn-bowling | Bowling Night | hangout | org-collective | London · Bloomsbury | 51.5235, -0.1240 | +5 | 19:00 | 2 | N | N | 24 / 17 | |
| ldn-openmic | Open Mic Night | music | org-collective | London · Camden | 51.5390, -0.1426 | +8 | 19:30 | 3 | N | Y | 50 / 23 | |
| ldn-football | Five-a-side Football | hangout | org-collective | London · Hackney | 51.5450, -0.0553 | +12 | 18:00 | 2 | N | N | 20 / 14 | |
| man-data | Data Analysis with Python | workshop | org-mancunian | Manchester · Oxford Road | 53.4668, -2.2339 | +3 | 10:00 | 3 | Y | N | 30 / 21 | ST0119-K13, ST0119-S1, ST0472-S4, ST0411-S2 |
| man-budgets | Project Budgets and Business Cases | workshop | org-buildright | Manchester · Spinningfields | 53.4810, -2.2525 | +5 | 13:00 | 3 | Y | N | 30 / 16 | ST0411-K1, ST0411-K6, ST0411-S1, ST0411-S4, ST0119-K4 |
| man-oprisk | Operational Risk in Banking | workshop | org-northline | Manchester · Spinningfields | 53.4802, -2.2510 | +7 | 09:30 | 3 | Y | N | 35 / 20 | ST0472-K19, ST0472-K20, ST0472-S7, ST0472-B5, ST0411-K9, ST0411-S5 |
| man-hack | Northern Apprentice Hackathon | hackathon | org-mancunian | Manchester · MediaCityUK | 53.4723, -2.2980 | +10 | 09:00 | 7 | Y | N | 100 / 63 | ST0119-S1, ST0119-S3, ST0119-S6, ST0411-S3, ST0411-B2, ST0472-S6, ST0472-B4 |
| man-procure | Procurement and Contracts Crash Course | workshop | org-buildright | Manchester · Piccadilly | 53.4774, -2.2309 | +13 | 10:00 | 2 | Y | N | 25 / 9 | ST0411-K8, ST0411-S6 |
| man-change | Leading Through Change | workshop | org-mancunian | Manchester · Oxford Road | 53.4660, -2.2330 | +16 | 13:00 | 2 | Y | N | 40 / 18 | ST0411-K4, ST0411-B1, ST0411-B6, ST0472-B2, ST0472-S7 |
| man-nq-social | Northern Quarter Social | networking | org-collective | Manchester · Northern Quarter | 53.4840, -2.2360 | +4 | 18:30 | 3 | N | Y | 60 / 38 | |
| man-paintball | Paintballing Day | hangout | org-collective | Manchester · Trafford | 53.4580, -2.3200 | +6 | 10:00 | 5 | N | N | 30 / 24 | |
| man-gig | Live Music Night | music | org-collective | Manchester · Deansgate | 53.4790, -2.2490 | +9 | 20:00 | 3 | N | Y | 80 / 35 | |
| man-climb | Climbing Taster | hangout | org-collective | Manchester · Ancoats | 53.4850, -2.2270 | +11 | 18:00 | 2 | N | N | 16 / 11 | |
| ldn-threat-past | Threat Modelling 101 | workshop | org-thames | London · Shoreditch | 51.5250, -0.0780 | -6 | 10:00 | 3 | Y | N | 30 / 26 | ST0119-K11, ST0119-S8, ST0119-K3 |
| ldn-quiz-past | Apprentice Quiz Night | networking | org-collective | London · Borough | 51.5010, -0.0910 | -3 | 19:00 | 2 | N | Y | 40 / 33 | |
| man-raid-past | Risk Workshop: RAID Logs | workshop | org-buildright | Manchester · Spinningfields | 53.4806, -2.2520 | -5 | 10:00 | 3 | Y | N | 25 / 20 | ST0411-K9, ST0411-S5, ST0411-K10 |
| ldn-regs-past | Regulation Bootcamp | workshop | org-northline | London · Canary Wharf | 51.5045, -0.0200 | -4 | 09:30 | 3 | Y | N | 40 / 31 | ST0472-K2, ST0472-S4, ST0472-S8 |

### 10.4 Personas (`data/personas.ts`), all fictional

| Field | Sam (primary demo) | Aisha | Priya | Jordan (organiser) |
| --- | --- | --- | --- | --- |
| id | u-sam | u-aisha | u-priya | u-jordan |
| email | sam.okafor@thamestech.ac.uk | aisha.rahman@buildright.co.uk | priya.shah@northlinebank.co.uk | jordan.lee@northlinebank.co.uk |
| dob | 2004-03-12 | 2001-09-02 | 2003-01-20 | 1994-05-08 |
| standard | ST0119 | ST0411 | ST0472 | – |
| pathway | Software engineering professional | Core | Operations | – |
| provider (organiserId for Jordan) | Thames Tech Training | Mancunian University Apprenticeships | City Project Academy | org-northline |
| city | London | Manchester | London | London |
| otjTargetHours | 1022 | 974 | 696 | – |
| otjLoggedHours | 410 | 300 | 250 | – |
| gatewayDate | 2028-06-30 | 2029-03-31 | 2028-09-30 | – |
| signedOff | K1, K2, K5, S6, B5 | K2, K3, S2, B2, B5 | K1, K3, K5, S1, S2, B1 | – |
| coachFocus | K11, S8 | K9, S5 | K2, S4 | – |
| RSVPs | ldn-threat-past, ldn-quiz-past, ldn-bowling | man-raid-past, man-nq-social | ldn-regs-past, ldn-quiz-past | – |
| favourites | ldn-fintech-hack | man-budgets | ldn-consumer-duty | – |

(Codes in the table are short; store full ids like `ST0119-K11`.)

Sanity check for Sam (London, DTSP): Cloud Security Lab scores 4 (K11 and S8 are coach focus, K5 is signed off), Fintech for Good Hackathon 2, Presenting 1, Risk Registers 1, Agile 1. After he marks Threat Modelling 101 attended, K3, K11 and S8 become *evidenced*, so Cloud Security Lab drops to 0 and the hackathon moves to the top. This change is a key demo moment.

### 10.5 Email rule (`lib/email.ts`)

```ts
const PERSONAL = ['gmail.com','googlemail.com','hotmail.com','hotmail.co.uk','outlook.com','live.com',
  'yahoo.com','yahoo.co.uk','icloud.com','me.com','aol.com','proton.me','protonmail.com'];
const KNOWN = ['thamestech.ac.uk','mancunian.ac.uk','northlinebank.co.uk','buildright.co.uk','cityprojectacademy.co.uk'];
export function checkEmail(email: string): { ok: boolean; verified: boolean; error?: string } {
  const domain = email.split('@')[1]?.toLowerCase().trim() ?? '';
  if (!domain) return { ok: false, verified: false, error: 'Enter a valid email' };
  if (PERSONAL.includes(domain)) return { ok: false, verified: false, error: 'Use your training provider, uni or employer email' };
  return { ok: true, verified: KNOWN.includes(domain) || domain.endsWith('.ac.uk') };
}
```

---

## 11. Demo script (acceptance test)

Every step must work without errors. Priorities: **P0** = this script; **P1** = everything else in Section 5; **P2** = stretch.

1. Welcome → **Continue as Sam**. (P0)
2. Profile shows 5 of 15 KSBs signed off, 410 / 1,022 OTJ hours, coach focus K11 and S8. (P0)
3. Discover: London map with pins in five colours; Recommended strip led by **Cloud Security Lab** ("Covers 2 of your gaps: K11, S8", Coach focus tag). (P0)
4. Open Cloud Security Lab: green OTJ badge, K11 and S8 marked Coach focus, K5 Signed off. RSVP and heart it. (P0)
5. Back to Discover, tap **Hangouts**: open Bowling Night, grey Social only badge. (P0)
6. Profile → **To confirm** → Threat Modelling 101 → **Mark "I went"**, type notes, save. OTJ hours become 413; K3, K11, S8 turn amber. (P0)
7. Discover: recommendations have re-ranked; the hackathon now leads. (P0)
8. **Generate report**: OTJ entry, KSB write-ups for K3, K11 and S8, progress summary. Copy one section, then **Download PDF** and **Download CSV**. (P0)
9. Switch persona to **Jordan**, create a workshop tagged with DTSP KSBs, publish; switch back to Sam and see it on the map and in recommendations if it hits his gaps. (P1)
10. Switch to Aisha (Manchester, Project manager) and Priya (London, Finance) to show it works across standards. (P1)

P2 stretch: "{n} from your course going" on events, gateway-soon boost, dark mode, subtle animations on cards.

---

## 12. Build order

1. Scaffold Vite + React + TS + Tailwind + router + lucide; layout shell with sidebar and bottom bar. (~15 min)
2. Seed data files, types, state context with `localStorage`, persona loader, Welcome page. (~25 min)
3. Discover: map with pins, filter chips, nearby list, event cards. (~30 min)
4. Event page with badges, KSB statuses, RSVP, heart. Score function + Recommended strip. (~20 min)
5. Profile and KSB tracker, To confirm list, Attend modal. (~20 min)
6. Report page: four sections, copy, CSV, print stylesheet. (~25 min)
7. Onboarding (3 steps) and Create event. (~15 min)
8. Search, Favourites, empty states, polish, run the demo script end to end. (~15 min)

Run the app, walk through Section 11, and fix anything that fails before adding P2 items.

---

## 13. Out of scope

Real authentication, a backend or database, real OneFile or Aptem integration, QR check-in, AI-written evidence, payments, real-time multi-device chat (chat is simulated in the browser, see Section 15), notifications, and native mobile apps. Mention these as the roadmap in the pitch, not in the build.

---

## Sources

- Apprenticeship funding rules 2026 to 2027, v3 (OTJ must be in working hours and build KSBs): https://assets.publishing.service.gov.uk/media/6a68cabe229c578debc1a78c/Funding_Rules_2627_Version_3_Final.pdf
- Skills England API, ST0119: https://skillsengland.education.gov.uk/api/apprenticeshipstandards/ST0119
- Skills England API, ST0411: https://skillsengland.education.gov.uk/api/apprenticeshipstandards/ST0411
- Skills England API, ST0472: https://skillsengland.education.gov.uk/api/apprenticeshipstandards/ST0472
- Aptem activity log fields: https://support.aptem.co.uk/hc/en-gb/articles/32329894685074-Activity-log-overview

---

## 14. Implementation notes

Decisions made while building, kept here so future changes stay consistent:

- **One OTJ predicate.** `countsForOtj(e) = e.inWorkingHours && e.ksbs.length > 0` (`src/lib/events.ts`) drives the green badge, OTJ hours, OTJ log entries, KSB evidence and the CSV. Don't re-implement the check inline.
- **Under-18 filter.** Always go through `visibleTo(e, user)` (`src/lib/events.ts`) for any list, map, search or recommendation.
- **Derived, not stored.** `evidenced`, `gaps` and `otjTotal` come from `computeProgress()` (`src/lib/progress.ts`) via `useProgress()`. Never persist them.
- **KSB status precedence** (event page, profile): Signed off > Evidenced > Coach focus > You need this (`ksbStatus()`).
- **Data model additions:** `EventItem.date?` (absolute ISO day, used by organiser-created events and taking priority over `dayOffset`) and `AppState.customOrganisers` (organisations created through organiser onboarding). The rest of Section 6 is unchanged.
- **Persona shortcuts** sign in as that persona without resetting their state; **Reset demo data** restores the whole seed and keeps the presenter signed in as the same persona.
- **Report checklist** ticks every attended event by default (social ones feed section 4).
- **Edit baseline** is `/onboarding?edit=baseline`, which opens step 3 prefilled and saves back to `/profile`.
- **Tailwind v4.** Tokens are in `@theme` in `src/index.css` (`ink`, `canvas`, `accent`, `otj`, `social`, `line`); shared classes are `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.card` and `.section-title`.
- **Map basemap.** `Tiles` in `src/components/EventMap.tsx` adds OpenFreeMap Positron as a MapLibre layer inside Leaflet, so pins, popups and click-to-place stay plain Leaflet. CARTO tiles were rejected (they now need an API key) and real Google Maps needs billing and a key; event pages link out with **Open in Google Maps** instead.
- **Leaflet z-index.** Maps get `z-0` so their panes stay below the sticky chips (`z-[1010]`), nav (`z-[1050]`), modal (`z-[1500]`) and toast (`z-[2000]`).
- **P2 done:** "{n} from your course" (a stable estimate) and subtle card/toast animations. Not done: gateway boost (commented in `score.ts`) and dark mode.

---

## 15. Group chat and privacy (added after the MVP)

Decided with the product owner after the first demo build. Chat is **simulated in the browser** (no backend), so messages persist in `localStorage` and show across personas in the same browser. Real-time chat would need a backend (e.g. Supabase) and is roadmap.

### Rules
1. **Auto-join on RSVP, with opt-out.** RSVPing adds you to the event's group chat when the "Join the group chat" checkbox is ticked. It defaults to the user's **Join event group chats when I RSVP** setting (on by default). Cancelling an RSVP leaves the chat. Going-but-not-in-chat users get a **Join group chat** button.
2. **Who can read a chat:** members only (people who joined) plus the host organisation's organisers. Everyone else sees "Only people going and the host can see this chat" and an RSVP or Join prompt, never the messages.
3. **Hosts:** organisers are members of every chat for their organisation's events (seeded for Jordan; added on Create). They post with a **Host** badge and can't leave.
4. **Names:** other people only ever see **first name + last initial**, the course short name, and the employer if that person allows it. Never email, date of birth or age.
5. **Privacy settings** (Profile → Privacy, stored on `user.privacy`, defaults in `lib/chat.ts`):
   - `autoJoinChats` (default on)
   - `showGoing`: `everyone` (default) | `coursemates` (same standard) | `nobody`. This controls "Who's going" on event pages and the chat members panel. Counts always include everyone.
   - `showEmployer` (default on)
6. **In-chat safety:** mute, leave (non-hosts), and **report**, which hides the message for the reporter and says it was reported to the host. Every chat shows a reminder that only attendees and the host can see it. The members panel warns against sharing contact details.
7. **Lifetime:** a chat stays open for 7 days after the event ends, then becomes read-only.
8. **Under-18s** can't see 18+ events (rule 3), so they can never join those chats. When friends and direct messages arrive, block DMs between adults and under-18s.

### Seeded content
- `data/people.ts`: 24 fictional apprentices (12 per city, mixed standards and employers). `peopleGoing(event)` returns a stable named subset of an event's `goingCount` (same city, preferring matching standards). Organiser-created events start with nobody.
- `data/chatSeed.ts`: per-category message templates that generate each event's history (host welcome plus attendee chatter, starting 09:00 the day before; past events also get a message or two after they ended).
- Persona RSVPs seed chat membership, with the last two seeded messages unread.
- Joining a chat triggers one simulated **"Welcome {name}! 👋"** about 2.5s later from someone already going (or the host on a new event).

### Data model additions
`Person`, `ChatMember { userId, eventId, joinedAt, lastReadAt?, muted? }`, `ChatMessage { id, eventId, authorId, text, sentAt }` (authorId is a user id, a person id, `host:{organiserId}` or `system`), `PrivacySettings`, `Apprentice.employer?`, `User.privacy?`, and `AppState.chatMembers / messages / hiddenMessages`. Seeded threads are generated from code and never stored. Older saved state is upgraded in `hydrate()` in `context/AppState.tsx`.

### Later: friends (planned, not built)
Mutual connections (request and accept). Suggest coursemates on the same standard at *other* employers, plus people from shared events and chats. "2 friends going" profile pictures on cards, a "Friends going" filter, friends first in attendee lists, and DMs between friends (with the under-18 rule). Reuse `PEOPLE` and the privacy settings above.
