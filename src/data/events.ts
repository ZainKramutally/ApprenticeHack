import type { EventItem } from '../types';

type Row = Omit<EventItem, 'ksbs' | 'venue'> & { ksbs?: string[]; venue: string };

const ev = (r: Row): EventItem => ({ ...r, ksbs: r.ksbs ?? [] });

// 20 upcoming (10 per city) + 4 past events used by the personas. All organisers fictional.
export const EVENTS: EventItem[] = [
  // ── London, upcoming ──────────────────────────────────────────────
  ev({
    id: 'ldn-cloud-lab', title: 'Cloud Security Lab', category: 'workshop', organiserId: 'org-thames',
    city: 'London', area: 'Shoreditch', venue: 'Thames Tech Training, Rivington St',
    lat: 51.5265, lng: -0.0786, dayOffset: 3, start: '10:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 30, goingCount: 18,
    ksbs: ['ST0119-K11', 'ST0119-S8', 'ST0119-K5'],
    description:
      'Break into a deliberately leaky cloud app, then lock it down with IAM policies, secrets management and logging. Bring a laptop; we provide sandbox accounts.',
  }),
  ev({
    id: 'ldn-agile', title: 'Agile Delivery in Practice', category: 'workshop', organiserId: 'org-citypm',
    city: 'London', area: 'Canary Wharf', venue: 'City Project Academy, Level 12',
    lat: 51.5054, lng: -0.0235, dayOffset: 4, start: '13:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 40, goingCount: 22,
    ksbs: ['ST0411-K5', 'ST0411-S8', 'ST0411-K10', 'ST0119-S5'],
    description:
      'Plan a two-week sprint from a messy backlog, estimate it as a team and handle a mid-sprint change request. Real tools, real trade-offs, no slides marathon.',
  }),
  ev({
    id: 'ldn-risk', title: 'Risk Registers that Actually Work', category: 'workshop', organiserId: 'org-northline',
    city: 'London', area: 'Bank', venue: 'Northline Bank, Threadneedle St',
    lat: 51.5133, lng: -0.089, dayOffset: 6, start: '09:30', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 35, goingCount: 19,
    ksbs: ['ST0411-K9', 'ST0411-S5', 'ST0472-K2', 'ST0472-S4', 'ST0119-K3'],
    description:
      "Northline's risk team shows how they score, own and actually close risks. You'll rebuild a real (anonymised) register and present your top three to the group.",
  }),
  ev({
    id: 'ldn-fintech-hack', title: 'Fintech for Good Hackathon', category: 'hackathon', organiserId: 'org-northline',
    city: 'London', area: "King's Cross", venue: 'The Granary Building',
    lat: 51.532, lng: -0.124, dayOffset: 9, start: '09:00', durationHours: 7,
    inWorkingHours: true, ageRestricted18: false, capacity: 80, goingCount: 54,
    ksbs: ['ST0119-S1', 'ST0119-S3', 'ST0119-S6', 'ST0472-K3', 'ST0472-S5', 'ST0472-B4', 'ST0411-B6'],
    description:
      'Mixed teams of tech, finance and project apprentices build a tool that helps people manage money better. Mentors from Northline on hand all day, lunch included.',
  }),
  ev({
    id: 'ldn-present', title: 'Presenting to Senior Stakeholders', category: 'workshop', organiserId: 'org-citypm',
    city: 'London', area: 'Holborn', venue: 'City Project Academy, Kingsway',
    lat: 51.5174, lng: -0.12, dayOffset: 11, start: '14:00', durationHours: 2,
    inWorkingHours: true, ageRestricted18: false, capacity: 25, goingCount: 12,
    ksbs: ['ST0411-K3', 'ST0411-S3', 'ST0411-B1', 'ST0472-S5', 'ST0119-S9', 'ST0119-B5'],
    description:
      'Turn a dense update into a five-minute story a director will act on. You will present twice and get specific feedback each time.',
  }),
  ev({
    id: 'ldn-consumer-duty', title: 'Consumer Duty Explained', category: 'workshop', organiserId: 'org-northline',
    city: 'London', area: 'Canary Wharf', venue: 'Northline Bank, Canada Square',
    lat: 51.5049, lng: -0.0195, dayOffset: 14, start: '10:00', durationHours: 2,
    inWorkingHours: true, ageRestricted18: false, capacity: 40, goingCount: 15,
    ksbs: ['ST0472-K2', 'ST0472-K4', 'ST0472-S8', 'ST0472-B1'],
    description:
      'What the FCA Consumer Duty means for your day job, told through real customer journeys. Leave with a one-page checklist for your team.',
  }),
  ev({
    id: 'ldn-drinks', title: 'Apprentice Drinks on the South Bank', category: 'networking', organiserId: 'org-collective',
    city: 'London', area: 'South Bank', venue: 'The Riverside Terrace',
    lat: 51.5055, lng: -0.116, dayOffset: 2, start: '18:30', durationHours: 3,
    inWorkingHours: false, ageRestricted18: true, capacity: 60, goingCount: 41,
    description:
      'Meet apprentices from every sector over a drink by the river. Soft drinks on the house, name badges by course so you can find your people.',
  }),
  ev({
    id: 'ldn-bowling', title: 'Bowling Night', category: 'hangout', organiserId: 'org-collective',
    city: 'London', area: 'Bloomsbury', venue: 'Bloomsbury Lanes',
    lat: 51.5235, lng: -0.124, dayOffset: 5, start: '19:00', durationHours: 2,
    inWorkingHours: false, ageRestricted18: false, capacity: 24, goingCount: 17,
    description:
      'Six lanes, mixed teams, terrible bowling encouraged. First game is on us.',
  }),
  ev({
    id: 'ldn-openmic', title: 'Open Mic Night', category: 'music', organiserId: 'org-collective',
    city: 'London', area: 'Camden', venue: 'The Lock Tavern back room',
    lat: 51.539, lng: -0.1426, dayOffset: 8, start: '19:30', durationHours: 3,
    inWorkingHours: false, ageRestricted18: true, capacity: 50, goingCount: 23,
    description:
      'Sing, play, do ten minutes of stand-up or just cheer. Sign-up sheet opens at 19:00.',
  }),
  ev({
    id: 'ldn-football', title: 'Five-a-side Football', category: 'hangout', organiserId: 'org-collective',
    city: 'London', area: 'Hackney', venue: 'Hackney Marshes 3G pitches',
    lat: 51.545, lng: -0.0553, dayOffset: 12, start: '18:00', durationHours: 2,
    inWorkingHours: false, ageRestricted18: false, capacity: 20, goingCount: 14,
    description:
      'Casual five-a-side, all abilities. Bibs and balls provided; bring trainers and water.',
  }),

  // ── Manchester, upcoming ──────────────────────────────────────────
  ev({
    id: 'man-data', title: 'Data Analysis with Python', category: 'workshop', organiserId: 'org-mancunian',
    city: 'Manchester', area: 'Oxford Road', venue: 'Mancunian University, Kilburn Building',
    lat: 53.4668, lng: -2.2339, dayOffset: 3, start: '10:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 30, goingCount: 21,
    ksbs: ['ST0119-K13', 'ST0119-S1', 'ST0472-S4', 'ST0411-S2'],
    description:
      'Clean a real open dataset with pandas and turn it into three charts a manager would understand. No Python experience needed.',
  }),
  ev({
    id: 'man-budgets', title: 'Project Budgets and Business Cases', category: 'workshop', organiserId: 'org-buildright',
    city: 'Manchester', area: 'Spinningfields', venue: 'Buildright Projects HQ',
    lat: 53.481, lng: -2.2525, dayOffset: 5, start: '13:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 30, goingCount: 16,
    ksbs: ['ST0411-K1', 'ST0411-K6', 'ST0411-S1', 'ST0411-S4', 'ST0119-K4'],
    description:
      "Build a business case and cost plan for a real Buildright refurbishment, then defend it to the 'board'. Spreadsheet templates provided.",
  }),
  ev({
    id: 'man-oprisk', title: 'Operational Risk in Banking', category: 'workshop', organiserId: 'org-northline',
    city: 'Manchester', area: 'Spinningfields', venue: 'Northline Bank, Hardman Square',
    lat: 53.4802, lng: -2.251, dayOffset: 7, start: '09:30', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 35, goingCount: 20,
    ksbs: ['ST0472-K19', 'ST0472-K20', 'ST0472-S7', 'ST0472-B5', 'ST0411-K9', 'ST0411-S5'],
    description:
      'Walk through three real operational incidents, map the controls that failed and design better ones. Run by Northline’s operational risk team.',
  }),
  ev({
    id: 'man-hack', title: 'Northern Apprentice Hackathon', category: 'hackathon', organiserId: 'org-mancunian',
    city: 'Manchester', area: 'MediaCityUK', venue: 'Mancunian University, MediaCity campus',
    lat: 53.4723, lng: -2.298, dayOffset: 10, start: '09:00', durationHours: 7,
    inWorkingHours: true, ageRestricted18: false, capacity: 100, goingCount: 63,
    ksbs: ['ST0119-S1', 'ST0119-S3', 'ST0119-S6', 'ST0411-S3', 'ST0411-B2', 'ST0472-S6', 'ST0472-B4'],
    description:
      'A one-day build challenge set by local employers. Form a cross-course team, pitch at 16:00, and win prizes for the best idea and best teamwork.',
  }),
  ev({
    id: 'man-procure', title: 'Procurement and Contracts Crash Course', category: 'workshop', organiserId: 'org-buildright',
    city: 'Manchester', area: 'Piccadilly', venue: 'Buildright Projects, Piccadilly Place',
    lat: 53.4774, lng: -2.2309, dayOffset: 13, start: '10:00', durationHours: 2,
    inWorkingHours: true, ageRestricted18: false, capacity: 25, goingCount: 9,
    ksbs: ['ST0411-K8', 'ST0411-S6'],
    description:
      'How tenders, frameworks and contract types really work, with a mock supplier negotiation to finish.',
  }),
  ev({
    id: 'man-change', title: 'Leading Through Change', category: 'workshop', organiserId: 'org-mancunian',
    city: 'Manchester', area: 'Oxford Road', venue: 'Mancunian University, Alliance Business School',
    lat: 53.466, lng: -2.233, dayOffset: 16, start: '13:00', durationHours: 2,
    inWorkingHours: true, ageRestricted18: false, capacity: 40, goingCount: 18,
    ksbs: ['ST0411-K4', 'ST0411-B1', 'ST0411-B6', 'ST0472-B2', 'ST0472-S7'],
    description:
      'Why people resist change and what good leaders do about it. Case studies, role play and a toolkit you can use on Monday.',
  }),
  ev({
    id: 'man-nq-social', title: 'Northern Quarter Social', category: 'networking', organiserId: 'org-collective',
    city: 'Manchester', area: 'Northern Quarter', venue: 'The Tib Street Taproom',
    lat: 53.484, lng: -2.236, dayOffset: 4, start: '18:30', durationHours: 3,
    inWorkingHours: false, ageRestricted18: true, capacity: 60, goingCount: 38,
    description:
      'Our monthly Manchester meet-up. Grab a drink, meet apprentices from other employers and swap tips on surviving end-point assessment.',
  }),
  ev({
    id: 'man-paintball', title: 'Paintballing Day', category: 'hangout', organiserId: 'org-collective',
    city: 'Manchester', area: 'Trafford', venue: 'Trafford Woods Paintball',
    lat: 53.458, lng: -2.32, dayOffset: 6, start: '10:00', durationHours: 5,
    inWorkingHours: false, ageRestricted18: false, capacity: 30, goingCount: 24,
    description:
      'A full day of team games in the woods. Kit, 200 paintballs and a barbecue lunch included.',
  }),
  ev({
    id: 'man-gig', title: 'Live Music Night', category: 'music', organiserId: 'org-collective',
    city: 'Manchester', area: 'Deansgate', venue: 'Deansgate Yard',
    lat: 53.479, lng: -2.249, dayOffset: 9, start: '20:00', durationHours: 3,
    inWorkingHours: false, ageRestricted18: true, capacity: 80, goingCount: 35,
    description:
      'Three local bands, two of them fronted by apprentices. Discounted tickets for Off the Clock members.',
  }),
  ev({
    id: 'man-climb', title: 'Climbing Taster', category: 'hangout', organiserId: 'org-collective',
    city: 'Manchester', area: 'Ancoats', venue: 'Ancoats Climbing Centre',
    lat: 53.485, lng: -2.227, dayOffset: 11, start: '18:00', durationHours: 2,
    inWorkingHours: false, ageRestricted18: false, capacity: 16, goingCount: 11,
    description:
      'Bouldering for total beginners. Shoes and a quick safety briefing included.',
  }),

  // ── Past events used by the personas ──────────────────────────────
  ev({
    id: 'ldn-threat-past', title: 'Threat Modelling 101', category: 'workshop', organiserId: 'org-thames',
    city: 'London', area: 'Shoreditch', venue: 'Thames Tech Training, Rivington St',
    lat: 51.525, lng: -0.078, dayOffset: -6, start: '10:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 30, goingCount: 26,
    ksbs: ['ST0119-K11', 'ST0119-S8', 'ST0119-K3'],
    description:
      'Map a simple web app, spot where attackers would get in using STRIDE, and rank the risks. Hands-on from the first ten minutes.',
  }),
  ev({
    id: 'ldn-quiz-past', title: 'Apprentice Quiz Night', category: 'networking', organiserId: 'org-collective',
    city: 'London', area: 'Borough', venue: 'The Borough Arms',
    lat: 51.501, lng: -0.091, dayOffset: -3, start: '19:00', durationHours: 2,
    inWorkingHours: false, ageRestricted18: true, capacity: 40, goingCount: 33,
    description:
      'Six rounds, teams of four, one questionable picture round. Winners get bragging rights and a bar tab.',
  }),
  ev({
    id: 'man-raid-past', title: 'Risk Workshop: RAID Logs', category: 'workshop', organiserId: 'org-buildright',
    city: 'Manchester', area: 'Spinningfields', venue: 'Buildright Projects HQ',
    lat: 53.4806, lng: -2.252, dayOffset: -5, start: '10:00', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 25, goingCount: 20,
    ksbs: ['ST0411-K9', 'ST0411-S5', 'ST0411-K10'],
    description:
      'Build a RAID log for a live construction project and practise escalating the right items. Templates you can take back to work.',
  }),
  ev({
    id: 'ldn-regs-past', title: 'Regulation Bootcamp', category: 'workshop', organiserId: 'org-northline',
    city: 'London', area: 'Canary Wharf', venue: 'Northline Bank, Canada Square',
    lat: 51.5045, lng: -0.02, dayOffset: -4, start: '09:30', durationHours: 3,
    inWorkingHours: true, ageRestricted18: false, capacity: 40, goingCount: 31,
    ksbs: ['ST0472-K2', 'ST0472-S4', 'ST0472-S8'],
    description:
      'A fast tour of the UK regulatory landscape, from the FCA Handbook to SM&CR, with quizzes on real scenarios.',
  }),
];
