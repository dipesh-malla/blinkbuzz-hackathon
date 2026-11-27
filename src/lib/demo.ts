// Demo data. Used ONLY when Supabase isn't configured (local preview),
// so the page can be reviewed before the backend exists.
// Real content is managed in Admin once VITE_SUPABASE_URL is set.
import type { Edition, Faq, Media, Sponsor, Track } from './types';

export const demoEditions: Edition[] = [
  {
    id: 'e1',
    slug: 'edition-01',
    number: 1,
    title: 'Edition 01',
    industry: null,
    problem: null,
    audience: 'School and +2 students (Grade 9 to 12), any stream',
    venue: 'TechSpire College, Kathmandu',
    starts_at: null,
    ends_at: null,
    registration_closes: null,
    registration_open: true,
    status: 'upcoming',
    team_min: 2,
    team_max: 4,
    fee_npr: 0,
    prizes: [],
    timeline: [
      { date: 'TBA', label: 'Registration opens' },
      { date: 'TBA', label: 'Industry problem revealed' },
      { date: 'TBA', label: 'Hack day at TechSpire College' },
      { date: 'TBA', label: 'Demos, judging and awards' },
    ],
    winners: [],
    is_current: true,
  },
  {
    id: 'e2',
    slug: 'edition-02',
    number: 2,
    title: 'Edition 02',
    industry: null,
    problem: null,
    audience: 'To be announced',
    venue: null,
    starts_at: null,
    ends_at: null,
    registration_closes: null,
    registration_open: false,
    status: 'planned',
    team_min: 2,
    team_max: 4,
    fee_npr: 0,
    prizes: [],
    timeline: [],
    winners: [],
    is_current: false,
  },
  {
    id: 'e3',
    slug: 'edition-03',
    number: 3,
    title: 'Edition 03',
    industry: null,
    problem: null,
    audience: 'To be announced',
    venue: null,
    starts_at: null,
    ends_at: null,
    registration_closes: null,
    registration_open: false,
    status: 'planned',
    team_min: 2,
    team_max: 4,
    fee_npr: 0,
    prizes: [],
    timeline: [],
    winners: [],
    is_current: false,
  },
];

export const demoSponsors: Sponsor[] = [];

// Abstract demo artworks (public/demo) so the gallery can be reviewed before
// the first event. They are never shown once Supabase is connected.
const art = (n: number) => `${import.meta.env.BASE_URL}demo/art-${n}.svg`;
export const demoMedia: Media[] = Array.from({ length: 9 }, (_, i) => ({
  id: `m${i + 1}`,
  edition_id: 'e1',
  kind: 'image' as const,
  url: art(i + 1),
  alt: `Demo artwork ${i + 1}`,
  sort: i + 1,
}));

export const demoTracks: Track[] = [
  { id: 't1', name: 'AI', blurb: 'Models that see, read and predict, built for a real workflow.', color: '#22e4ff', visual: 'neural', sort: 1 },
  { id: 't2', name: 'FinTech', blurb: 'Payments, lending and saving tools for how Nepal actually pays.', color: '#3dffa8', visual: 'candles', sort: 2 },
  { id: 't3', name: 'HealthTech', blurb: 'Care that reaches further: records, triage and remote checks.', color: '#ff4d8d', visual: 'pulse', sort: 3 },
  { id: 't4', name: 'Robotics', blurb: 'Machines that sense and move, from sensors to working arms.', color: '#ffb020', visual: 'arm', sort: 4 },
  { id: 't5', name: 'Web3', blurb: 'Open ledgers and digital ownership, where trust is the problem.', color: '#a66bff', visual: 'chain', sort: 5 },
];

export const demoFaqs: Faq[] = [
  {
    id: 'f1',
    question: 'Who can take part?',
    answer:
      'Edition 01 is for students in Grade 9 to 12, from any stream. Later editions open to bachelor students, each with its own industry problem.',
    sort: 1,
  },
  {
    id: 'f2',
    question: 'Do I need to know how to code?',
    answer:
      'One person on the team who can build is enough. Research, design and the final pitch matter as much as the code.',
    sort: 2,
  },
  {
    id: 'f3',
    question: 'How big is a team?',
    answer:
      'Team size is shown in the edition details above and on the form. You can register as a team, and we help solo students find one.',
    sort: 3,
  },
  {
    id: 'f4',
    question: 'When do we see the problem?',
    answer:
      'The industry and the problem statement are revealed on the date in the timeline, so every team starts from the same point.',
    sort: 4,
  },
  {
    id: 'f5',
    question: 'What should we bring?',
    answer:
      'A charged laptop per team, chargers and your student ID. Food, water, power and Wi-Fi are on us.',
    sort: 5,
  },
  {
    id: 'f6',
    question: 'Why is a guardian contact needed?',
    answer:
      'Most school and +2 students are under 18, so we ask for a parent or guardian who agrees to your participation and can be reached on the day.',
    sort: 6,
  },
];
