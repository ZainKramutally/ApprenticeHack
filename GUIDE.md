# Off the Clock: Guide

This guide has three parts:

1. [Presenting the demo](#1-presenting-the-demo): set-up, the run-sheet and how to recover if something goes wrong.
2. [How it works](#2-how-it-works): where everything lives and how the domain rules are enforced.
3. [Extending it](#3-extending-it): adding events, standards and personas, and tuning recommendations.

The product spec lives in [CLAUDE.md](CLAUDE.md). This guide covers the code that implements it.

---

## 1. Presenting the demo

### Before you go on

- [ ] `npm install` then `npm run dev`, and open http://localhost:5173.
- [ ] Check you have internet so the map loads (OpenFreeMap, no key needed). Without it the pins still work on a plain grey map.
- [ ] Go to **Profile → Reset demo data** (or open `/welcome` in a fresh private window). This clears `localStorage` and reloads the seed.
- [ ] Start on the **Welcome** screen.
- [ ] Browser zoom at 100%, window at least 1024px wide, so the left rail and the two-column grid show.

All event dates are relative to **today** (`dayOffset`), so the demo always looks current. The weekday moves with the day you present, so a "working hours" workshop can land on a Saturday or Sunday. Nobody tends to notice, but don't be surprised.

### Run-sheet

| # | Do | Point out |
|---|----|-----------|
| 1 | Welcome → **Continue as Sam (DTSP, London)** | Personal email domains are blocked; this is apprentices only. |
| 2 | **Profile** (person icon) | **5 / 15** KSBs signed off, **410 / 1,022** OTJ hours, coach focus **K11** and **S8**, 636 days to gateway. |
| 3 | **Discover** (compass) | Map pins in five category colours. **Recommended for your KSBs** is led by **Cloud Security Lab**, "Covers 2 of your gaps: K11, S8", with a Coach focus tag. |
| 4 | Open **Cloud Security Lab** | Green **Counts towards OTJ** badge. In KSBs covered, K11 and S8 show **Coach focus** and K5 shows **Signed off**. Tap **RSVP** (it changes to Going ✓ and the count goes up) and the **heart**. |
| 5 | Back, tap the **Hangouts** chip, scroll to *events nearby*, open **Bowling Night** | Grey **Social only** badge. Socials never count as OTJ. |
| 6 | **Profile → My events → To confirm → Threat Modelling 101 → Mark "I went"** | Hours prefill to the event length. Type a sentence of notes (20+ characters) and **Save**. Toast: "Added to your report". OTJ goes to **413**, and K3, K11 and S8 turn **amber** (Evidenced, awaiting sign-off). |
| 7 | **Discover** | The strip has re-ranked: Cloud Security Lab drops out (its KSBs are now evidenced) and **Fintech for Good Hackathon** leads. This is the key moment. |
| 8 | **Profile → Generate report** | The four sections: OTJ log entry, KSB write-ups for K3, K11 and S8, progress summary, and other events. Press **Copy** on one, then **Download PDF** (print dialog → Save as PDF) and **Download CSV**. Show the self-declared disclaimer. |
| 9 | Rail → **Switch persona** (bottom icon) → **Jordan**. **Create** (plus icon): title, Workshop, description, area and venue, a weekday at 10:00 (working hours switches on automatically), tick **DTSP** then e.g. **K13, S9, B6**. **Publish**. | Only employer, provider and uni organisers can tag KSBs. Switch back to **Sam**: the new event is on the map and tops his recommendations ("Covers 3 of your gaps"). |
| 10 | Switch to **Aisha** then **Priya** | Manchester and Project Management for Aisha; Finance (Operations pathway) for Priya. Same engine, different standards. |
| 11 | As **Sam**, open **Fintech for Good Hackathon** and press **RSVP** with "Join the group chat" ticked | Toast: "You're going · added to the group chat". A welcome arrives about 2 seconds later and **Chats** gets an unread badge. Open the chat and post "Anyone want to team up?". Point out that names are first name + last initial, with course and employer. |
| 12 | Switch to **Priya**, open **Chats → Fintech** via the event page | The chat is locked ("Only people going and the host can see this chat") until she RSVPs. Then she sees Sam's message. |
| 13 | As **Sam**, **Profile → Privacy**: set "Who can see I'm going" to **Nobody** and turn off "Show my employer". Switch to Priya. | Sam has gone from "Who's going" and the chat's member list, but the count is unchanged. His messages now show "Sam O. · DTSP" with no employer. |

### Extra things you can show

- **Under-18s**: Welcome → Get started, use a date of birth under 18 and a `.ac.uk` email. 18+ events (drinks, open mic, gigs) disappear from the map, lists, search and recommendations.
- **Email rule**: try `@gmail.com` in onboarding to see "Use your training provider, uni or employer email". Any `.ac.uk` or known employer domain gets a **Verified** tick.
- **Live KSB edits**: on Profile, tap any KSB in the checklist to toggle "Signed off". Recommendations update straight away.
- **Apprentice-run organiser**: sign up as an Organiser with type "Apprentice-run group". The KSB picker on Create is replaced by an explanation.
- **Mobile**: narrow the window below 768px and the rail becomes a bottom tab bar.
- **Chat safety**: hover any message from someone else and press the flag to **report** it (hidden for you, "reported to the host"). Mute and leave are in the chat header. Hosts (switch to Jordan) see every chat for their events and can't leave.
- **Opt out at RSVP**: untick "Join the group chat" before pressing RSVP. You're going but not in the chat, and the event page offers **Join group chat** instead.
- **Google Maps**: every event page has an **Open in Google Maps** link.

### If something goes wrong

| Symptom | Fix |
|---|---|
| Data looks odd after rehearsing | **Profile → Reset demo data**. You stay signed in as the same persona. |
| Stuck signed in as the wrong person | Rail → bottom **Switch persona** icon, or Profile → **Switch demo persona**. |
| Map is grey | No internet. Pins still work; carry on. |
| Blank page | Open the browser console. To recover, run `localStorage.removeItem('otc:v1')` and reload. |
| Port 5173 in use | `npm run dev -- --port 5174` |

### Roadmap talking points (deliberately not built)

Real authentication, a backend, real OneFile and Aptem integration, QR check-in, AI-written evidence, payments, chat, notifications and native apps.

---

## 2. How it works

### Stack

Vite, React 18, TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`), react-router-dom v6, react-leaflet v4 with an OpenFreeMap Positron vector basemap (MapLibre GL rendered inside Leaflet), lucide-react and date-fns. State is a single React context with `useReducer`, persisted to `localStorage`.

### File map

```
src/
  types.ts                 Data model (spec §6) plus two additions, see "Deviations"
  data/
    standards.ts           3 standards + KSBs; getKsb, ksbsForPathway, userKsbs
    organisers.ts          6 organisers, type labels, canTagKsbs (rule 5)
    events.ts              24 seeded events (20 upcoming, 4 past)
    personas.ts            Sam, Aisha, Priya, Jordan + their seeded RSVPs/favourites
    people.ts              24 fictional apprentices who fill chats and "Who's going"; peopleGoing()
    chatSeed.ts            Per-category templates that generate each event's chat history
  lib/
    dates.ts               startsAt/endsAt (dayOffset → Date), age, formatters
    events.ts              Category colours/icons, countsForOtj, visibleTo (under-18), filter matching
    progress.ts            computeProgress → signedOff / evidenced / gaps / otjTotal; ksbStatus
    score.ts               scoreEvent (spec §7) + recommend() for the strip
    report.ts              OTJ entry, KSB write-ups, progress summary, CSV, copy helper
    email.ts               checkEmail (rule 4)
    chat.ts                Privacy defaults, name display rules, unread counts, who-can-see-who
    storage.ts             load/save/clear `otc:v1`, all wrapped in try/catch
  context/AppState.tsx     Reducer, provider, toast, and hooks (useCurrentUser, useProgress,
                           useChatSummaries, useThreadBuilder, useChatActions, …)
  components/              Sidebar/BottomBar, EventCard, EventMap (+ StaticMap, PickerMap),
                           FilterChips, Badge, KsbList, AttendModal, StatTile, Logo, Avatar, Toggle
  pages/                   Welcome, Onboarding, Discover, EventPage, Search, Chats,
                           Favourites, Profile, Report, CreateEvent
  App.tsx                  Routes; <Shell> adds the nav and redirects signed-out users to /welcome
```

### Data flow

```
seed (data/*) ──► AppState (reducer) ──► localStorage 'otc:v1'
                      │
                      ├─ useAllEvents()  = seeded EVENTS + state.customEvents
                      ├─ useProgress()   = computeProgress(user, attendance, events)
                      │                     → evidenced, gaps, otjTotal
                      └─ pages read hooks; actions dispatch:
                         login · logout · addUser · updateUser · toggleRsvp ·
                         toggleFavourite · saveAttendance · toggleSignedOff ·
                         addEvent · joinChat · leaveChat · postMessage · markRead ·
                         toggleMute · reportMessage · updatePrivacy · reset
```

Everything derived (gaps, scores, badges, report text) is computed on render from state. There are no caches to invalidate, so marking an event attended or toggling a KSB updates every screen at once.

### Where each domain rule lives

| Rule (CLAUDE.md §3) | Enforced in |
|---|---|
| 1. OTJ only in working hours | `countsForOtj()` in `lib/events.ts`, used by `computeProgress`, the report and the attend modal. `scoreEvent` also returns 0 when `!inWorkingHours`. |
| 2. Badges | `EventBadges` in `components/Badge.tsx`, on every card, map popup and event page. |
| 3. Under-18s | `visibleTo()` in `lib/events.ts`, applied in Discover (map and lists), Search, Favourites, the event page and `recommend()`. |
| 4. Apprentice-only email | `checkEmail()` in `lib/email.ts`; used in Onboarding, and for the Verified tick on Profile. |
| 5. Only employer/provider/uni tag KSBs | `canTagKsbs()` in `data/organisers.ts`; CreateEvent hides the picker and saves `ksbs: []`. |
| 6. Self-declared attendance | `DISCLAIMER` in `lib/report.ts`, shown at the foot of the report and in the PDF. |
| 7. KSB ids `"{std}-{code}"` | `k()` helper in `data/standards.ts`; the UI only ever renders `ksb.code` and `ksb.text`. |
| Chat: auto-join with opt-out | `toggleRsvp` with `joinChat` in the reducer; checkbox on `EventPage` defaults to `privacyOf(user).autoJoinChats`. |
| Chat: members + hosts only | `Conversation` in `pages/Chats.tsx` checks membership or host before rendering messages. |
| Privacy: names and who's going | `shortName`, `resolveAuthor`, `canSeeGoing`, `visibleAttendees` in `lib/chat.ts`. |

### Recommendations

`scoreEvent` follows spec §7 exactly: 0 if the event is outside working hours or has started, otherwise +2 for each gap KSB that's in the coach's focus and +1 for any other gap KSB. `recommend()` filters to the selected city and the under-18 rule, keeps `score > 0`, sorts by score then start time, and takes 5. The card subtitle lists the gap KSBs covered.

A gap is a KSB on the learner's list (core KSBs plus their pathway) that is neither signed off nor evidenced. "Evidenced" means it was tagged on an attended event that counts for OTJ.

### Group chat (simulated)

There's no backend, so chat lives in `localStorage` like everything else. Because every persona shares the same browser storage, a message Sam posts is there when you switch to Priya. That's how the multi-user demo works.

- **Threads** = seeded history generated from code (`seedThread()` in `data/chatSeed.ts`) + messages posted in this browser (`state.messages`), minus anything the viewer reported. Built by `useThreadBuilder()`.
- **Membership** lives in `state.chatMembers` (with `lastReadAt` for unread counts and `muted`). Persona RSVPs and Jordan's host chats are seeded; RSVP, Join, Leave and Create add or remove rows.
- **Unread** = messages from others after `lastReadAt`. Opening a chat marks it read. Muted chats don't count towards the nav badge.
- **The welcome reply** is a `setTimeout` in `useChatActions()`. It's the only "fake live" behaviour; seeded people don't otherwise reply.
- **Read-only** a week after the event ends (`isReadOnly()`).

The full rules are in CLAUDE.md Section 15.

### Report

`/report` filters the user's attendance by date range (default: the last 3 months) and a per-event checklist (default: everything ticked). Events that count for OTJ produce OTJ log entries, KSB write-ups and CSV rows. Social events are listed under "Other events attended". **Download PDF** calls `window.print()`. The print styles (`print:` utilities plus `@page { size: A4 }` in `index.css`) hide the nav, controls and buttons, and show a header line.

### Deviations and decisions beyond the spec

- **`countsForOtj = inWorkingHours && ksbs.length > 0`.** Rule 1 makes working hours necessary, and the green badge also requires KSBs. Using one helper keeps the badge, OTJ hours and the report consistent. A working-hours event with no KSBs shows "Social only" and adds no hours.
- **`EventItem.date?`** (absolute ISO date) for organiser-created events, so they stay on the chosen day across reloads. Seeded events still use `dayOffset`.
- **`AppState.customOrganisers`** holds organisations created through organiser onboarding.
- **Persona shortcuts don't reset that persona.** "Continue as Sam" signs in as Sam with whatever state he has, so step 9 (switch away and back) keeps his progress. Use Reset to start over.
- **Report checklist** ticks every attended event by default, not only working-hours ones, so "Other events attended" isn't empty by default.
- **"{n} from your course"** (P1) is a stable estimate derived from the event's KSB mix. No real attendee data exists.
- **Switch persona** also sits at the bottom of the desktop rail, for presenter speed.
- **Map**: OpenFreeMap Positron instead of OSM's default tiles (simpler, closer to Google Maps' clean look). CARTO now needs an API key; real Google Maps needs billing and a key, so event pages link out to Google Maps instead.
- **P2 items done:** subtle card and toast animations (turned off under `prefers-reduced-motion`) and "{n} from your course". Not done: gateway boost and dark mode.

---

## 3. Extending it

### Add an event

Append to `EVENTS` in `src/data/events.ts`:

```ts
ev({
  id: 'ldn-sql', title: 'SQL for Analysts', category: 'workshop', organiserId: 'org-thames',
  city: 'London', area: 'Shoreditch', venue: 'Thames Tech Training, Rivington St',
  lat: 51.5262, lng: -0.0790, dayOffset: 15, start: '10:00', durationHours: 3,
  inWorkingHours: true, ageRestricted18: false, capacity: 30, goingCount: 10,
  ksbs: ['ST0119-K13', 'ST0472-S4'],
  description: 'Write real queries against a sample bank dataset. No experience needed.',
}),
```

New seeded events show up on the next reload, because events are read from code. Changes to personas, RSVPs or favourites need **Reset demo data**, because those are saved in `localStorage`.

### Add a standard

1. Add the code to `StandardCode` in `src/types.ts`.
2. Add a `Standard` to `STANDARDS` in `src/data/standards.ts`, using `k(std, code, text, pathway?)` for each KSB. Pathway-only KSBs set the 4th argument.
3. The Course chips, onboarding, Create event KSB picker and event pages all read from `STANDARDS`, so nothing else needs to change.

### Add a city

Extend `City` in `types.ts`, then add it to `CITIES` and `CITY_CENTRE` in `lib/events.ts`.

### Add a seeded person (chat and "Who's going")

Add a `p(...)` line to `PEOPLE` in `src/data/people.ts`. They'll automatically appear in chats for events in their city, preferring events tagged for their standard. To change what people say, edit the templates in `src/data/chatSeed.ts` (`{title}`, `{start}`, `{venue}`, `{area}`, `{host}`, `{meet}`, `{course0}`, `{employer0}` and `{course2}` are filled in per event).

### Swap the map style

Change `BASEMAP_STYLE` in `src/components/EventMap.tsx`. Other free OpenFreeMap styles: `https://tiles.openfreemap.org/styles/liberty` (closest to Google Maps) and `.../styles/bright`.

### Add a persona

Add it to `src/data/personas.ts` (the object, `PERSONAS`, `PERSONA_SHORTCUTS`, and any `SEED_RSVPS`/`SEED_FAVOURITES`), then reset demo data.

### Tune recommendations

Edit `scoreEvent` in `src/lib/score.ts`. The spec's P2 gateway boost is already there as a comment:

```ts
if (daysUntil(u.gatewayDate) < 180) score *= 1.5;
```

### Change the look

Colour tokens live in the `@theme` block in `src/index.css` (`ink`, `canvas`, `accent`, `otj`, `social`, …). Category colours and icons are in `CATEGORY` in `src/lib/events.ts`. Reusable classes (`.btn-primary`, `.btn-secondary`, `.input`, `.card`) are in the `@layer components` block.

### Checks

```bash
npm run typecheck
```

```bash
npm run build
```

There are no unit tests. The demo script in the README is the acceptance test, so walk through it after any change to `lib/`.
