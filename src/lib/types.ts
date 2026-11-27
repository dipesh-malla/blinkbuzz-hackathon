export type EditionStatus = 'planned' | 'upcoming' | 'live' | 'completed';

export type TimelineItem = { date: string; label: string };
export type Prize = { place: string; reward: string };
export type Winner = { place: string; team: string; project: string };

export type Edition = {
  id: string;
  slug: string;
  number: number;
  title: string; // e.g. "Edition 01"
  industry: string | null; // e.g. "Agriculture" — null = to be announced
  problem: string | null; // problem statement — null = revealed later
  audience: string; // who can join
  venue: string | null;
  starts_at: string | null; // ISO date
  ends_at: string | null;
  registration_closes: string | null;
  registration_open: boolean;
  status: EditionStatus;
  team_min: number;
  team_max: number;
  fee_npr: number; // 0 = free
  prizes: Prize[];
  timeline: TimelineItem[];
  winners: Winner[];
  is_current: boolean;
};

export type SponsorTier = 'title' | 'powered' | 'gold' | 'sponsor' | 'partner' | 'community';

/** Tiers shown in the big card slider; the rest circle on the rings. */
export const FEATURED_TIERS: SponsorTier[] = ['title', 'powered', 'gold'];

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: SponsorTier;
  edition_id: string | null; // null = partner of the whole series
  sort: number;
};

export type Media = {
  id: string;
  edition_id: string | null;
  kind: 'image' | 'video';
  url: string; // image URL, or YouTube URL for videos
  alt: string;
  sort: number;
};

export type TrackVisual = 'neural' | 'candles' | 'pulse' | 'arm' | 'chain' | 'orbit';

/** An innovation category. Lights up a region of the hero brain. */
export type Track = {
  id: string;
  name: string; // "AI"
  blurb: string; // one line
  color: string; // hex, its glow colour
  visual: TrackVisual; // the animated mini graphic
  sort: number;
};

export type Faq = { id: string; question: string; answer: string; sort: number };

export type Member = {
  name: string;
  email: string;
  phone: string;
  grade: string;
};

export type Registration = {
  id?: string;
  edition_id: string;
  team_name: string;
  school: string;
  district: string;
  members: Member[];
  guardian_name: string;
  guardian_phone: string;
  consent: boolean;
  created_at?: string;
};

export type Settings = {
  palette?: string;
  brand?: string;
  headline?: string;
  tagline?: string;
  contactEmail?: string;
  sponsorEmail?: string;
};
