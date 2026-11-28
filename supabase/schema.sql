-- ════════════════════════════════════════════════════════════════
--  BlinkBuzz hackathon site — Supabase schema
--  Run once in Supabase → SQL Editor → New query → Run.
-- ════════════════════════════════════════════════════════════════

-- ── Admins ──────────────────────────────────────────────────────
-- Add an admin: create the user in Authentication → Users, then
--   insert into public.admins (email) values ('you@yourdomain.com');
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

-- ── Editions ────────────────────────────────────────────────────
create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  number int not null,
  title text not null,
  industry text,
  problem text,
  audience text not null default 'To be announced',
  venue text,
  starts_at date,
  ends_at date,
  registration_closes timestamptz,
  registration_open boolean not null default false,
  status text not null default 'planned' check (status in ('planned','upcoming','live','completed')),
  team_min int not null default 2,
  team_max int not null default 4,
  fee_npr int not null default 0,
  prizes jsonb not null default '[]',
  timeline jsonb not null default '[]',
  winners jsonb not null default '[]',
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Sponsors & partners ─────────────────────────────────────────
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  tier text not null default 'partner' check (tier in ('title','powered','gold','sponsor','partner','community')),
  edition_id uuid references public.editions(id) on delete set null,
  sort int not null default 0
);

-- ── Gallery: photos and videos ──────────────────────────────────
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references public.editions(id) on delete cascade,
  kind text not null default 'image' check (kind in ('image','video')),
  url text not null,
  alt text not null default '',
  sort int not null default 0
);

-- ── Tracks (innovation categories that light up the hero brain) ─
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  blurb text not null default '',
  color text not null default '#22e4ff',
  visual text not null default 'neural' check (visual in ('neural','candles','pulse','arm','chain','orbit','idea','rocket','leaf','shield','cloud','book','cart','globe','bolt','people')),
  sort int not null default 0
);

-- ── FAQ ─────────────────────────────────────────────────────────
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort int not null default 0
);

-- ── Site settings (palette, brand, emails) ──────────────────────
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- ── Registrations ───────────────────────────────────────────────
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  team_name text not null,
  school text not null,
  district text not null,
  members jsonb not null,
  guardian_name text not null,
  guardian_phone text not null,
  consent boolean not null check (consent = true),
  created_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.admins        enable row level security;
alter table public.editions      enable row level security;
alter table public.sponsors      enable row level security;
alter table public.media         enable row level security;
alter table public.faqs          enable row level security;
alter table public.tracks        enable row level security;
alter table public.settings      enable row level security;
alter table public.registrations enable row level security;

-- Public content: anyone reads, only admins write.
do $$
declare t text;
begin
  foreach t in array array['editions','sponsors','media','faqs','tracks','settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Admins table: admins can see it (used by the admin panel to check access).
drop policy if exists "admin read" on public.admins;
create policy "admin read" on public.admins for select using (public.is_admin());

-- Registrations: anyone may submit while that edition is open; only admins read.
drop policy if exists "public insert when open" on public.registrations;
create policy "public insert when open" on public.registrations for insert
  with check (exists (
    select 1 from public.editions e
    where e.id = edition_id and e.registration_open
      and (e.registration_closes is null or e.registration_closes > now())
  ));
drop policy if exists "admin read" on public.registrations;
create policy "admin read" on public.registrations for select using (public.is_admin());
drop policy if exists "admin delete" on public.registrations;
create policy "admin delete" on public.registrations for delete using (public.is_admin());

-- ════════════════════════════════════════════════════════════════
--  Storage bucket for logos, photos (public read, admin upload)
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ════════════════════════════════════════════════════════════════
--  Starter content (safe to re-run)
-- ════════════════════════════════════════════════════════════════
insert into public.editions (slug, number, title, audience, venue, registration_open, status, team_min, team_max, fee_npr, timeline, is_current)
values (
  'edition-01', 1, 'Edition 01', 'School and +2 students (Grade 9 to 12), any stream', 'TechSpire College, Kathmandu',
  true, 'upcoming', 2, 4, 0,
  '[{"date":"TBA","label":"Registration opens"},{"date":"TBA","label":"Industry problem revealed"},{"date":"TBA","label":"Hack day at TechSpire College"},{"date":"TBA","label":"Demos, judging and awards"}]',
  true
) on conflict (slug) do nothing;

insert into public.editions (slug, number, title, status, is_current)
values ('edition-02', 2, 'Edition 02', 'planned', false),
       ('edition-03', 3, 'Edition 03', 'planned', false)
on conflict (slug) do nothing;

insert into public.settings (key, value) values ('palette', 'neural-night')
on conflict (key) do nothing;

insert into public.faqs (question, answer, sort)
select * from (values
  ('Who can take part?', 'Each edition sets its own audience. Edition 01 is for high school students from any stream; later editions can open to university students and young professionals, each with its own industry problem.', 1),
  ('Do I need to know how to code?', 'One person on the team who can build is enough. Research, design and the final pitch matter as much as the code.', 2),
  ('How big is a team?', 'Team size is shown in the edition details and on the form. You can register as a team, and we help solo students find one.', 3),
  ('When do we see the problem?', 'The industry and the problem statement are revealed on the date in the timeline, so every team starts from the same point.', 4),
  ('What should we bring?', 'A charged laptop per team, chargers and your student ID. Food, water, power and Wi-Fi are on us.', 5),
  ('Why is a guardian contact needed?', 'Most school and +2 students are under 18, so we ask for a parent or guardian who agrees to your participation and can be reached on the day.', 6)
) v(question, answer, sort)
where not exists (select 1 from public.faqs);

insert into public.tracks (name, blurb, color, visual, sort)
select * from (values
  ('AI', 'Models that see, read and predict, built for a real workflow.', '#22e4ff', 'neural', 1),
  ('FinTech', 'Payments, lending and saving tools for how Nepal actually pays.', '#3dffa8', 'candles', 2),
  ('HealthTech', 'Care that reaches further: records, triage and remote checks.', '#ff4d8d', 'pulse', 3),
  ('Robotics', 'Machines that sense and move, from sensors to working arms.', '#ffb020', 'arm', 4),
  ('Web3', 'Open ledgers and digital ownership, where trust is the problem.', '#a66bff', 'chain', 5)
) v(name, blurb, color, visual, sort)
where not exists (select 1 from public.tracks);

-- Upgrading from the first version of this schema? Run these two lines once:
-- alter table public.sponsors drop constraint if exists sponsors_tier_check;
-- alter table public.sponsors add constraint sponsors_tier_check check (tier in ('title','powered','gold','sponsor','partner','community'));

-- ── Partner requests ("Become a partner" form) ───────────────────
create table if not exists public.sponsor_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 2 and 120),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  website text check (website is null or char_length(website) <= 300),
  tier_interest text not null default 'sponsor' check (tier_interest in ('title','powered','gold','sponsor','partner','community','not-sure')),
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','contacted','accepted','declined')),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sponsor_requests enable row level security;
drop policy if exists "public insert" on public.sponsor_requests;
create policy "public insert" on public.sponsor_requests for insert to anon, authenticated
  with check (status = 'new' and notified_at is null);
drop policy if exists "admin all" on public.sponsor_requests;
create policy "admin all" on public.sponsor_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create index if not exists sponsor_requests_created_idx on public.sponsor_requests (created_at desc);

-- Admin-only settings (never public), e.g. notifyEmail: where partner-request emails go.
create table if not exists public.private_settings (
  key text primary key,
  value text not null
);
alter table public.private_settings enable row level security;
drop policy if exists "admin all" on public.private_settings;
create policy "admin all" on public.private_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Sponsor extras: optional category ("Food & Beverage" → "Food & Beverage sponsor") and logo plate colour.
alter table public.sponsors add column if not exists category text check (category is null or char_length(category) <= 40);
alter table public.sponsors add column if not exists logo_bg text not null default 'light' check (logo_bg in ('light','dark','none'));

-- Each edition decides who can join: level choices on the form and whether a guardian is needed.
alter table public.editions add column if not exists participant_levels text not null default '';
alter table public.editions add column if not exists needs_guardian boolean not null default false;
alter table public.registrations alter column guardian_name drop not null;
alter table public.registrations alter column guardian_phone drop not null;

-- Start time (Nepal time) for the countdown, and a switch to hide it.
alter table public.editions add column if not exists start_time time;
alter table public.editions add column if not exists show_countdown boolean not null default true;
