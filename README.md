# BlinkBuzz Hackathon — website

Landing page, edition pages, registration and admin panel for the BlinkBuzz hackathon series.

- **Frontend:** Vite, React, TypeScript, Tailwind, React Three Fiber + drei, GSAP (ScrollTrigger, Flip, Draggable), Lenis, React Bits (Stepper, DecryptedText)
- **Backend:** Supabase (Postgres, Auth, Storage), free plan

```
npm install
npm run dev        # http://localhost:5173 (demo content until Supabase is set up)
npm run build      # outputs dist/
```

## What's on the page
| Section | File | How it's built |
|---|---|---|
| Hero: interactive neural brain | `components/three/BrainScene.tsx`, `brainGeometry.ts`, `sections/Hero.tsx` | About 6,000 neurons and 2,000 synapses generated in code, with custom shaders. Each track lights its own region and fires pulses; neurons near the cursor wake up; drag to turn it. Nebula sky, light shafts and a holographic projector. |
| How it works | `sections/HowItWorks.tsx`, `components/three/StepObjects.tsx` | Four 3D objects (badge, sealed cube, chip, trophy) drawn by one shared canvas (`SharedCanvas.tsx`, drei `View`) |
| Tracks bento | `sections/Tracks.tsx`, `components/TrackViz.tsx` | Animated SVG graphics per track |
| Every edition | `sections/Editions.tsx`, `components/three/OrbitSystem.tsx` | The orbit. Every edition you add becomes a planet. |
| Winning projects | `sections/Showcase.tsx` | Shows up automatically once an edition has winners |
| Gallery | `sections/Gallery.tsx` | GSAP Flip gallery modal; arrow keys and Esc work |
| Title / Powered by / Gold | `sections/Sponsors.tsx` → `FeaturedSlider` | GSAP infinite card slider: drag, Prev/Next, arrow keys, autoplay |
| Other sponsors & partners | `sections/Sponsors.tsx` → `Ring` | Cards travelling round two 3D rings in opposite directions; they pause on hover |
| Registration | `sections/Register.tsx`, `components/three/Terrain.tsx` | 4-step form (React Bits Stepper) over a 3D point-cloud landscape |
| Edition page | `pages/EditionPage.tsx` | Venue, dates, team size, fee, timeline, prizes, winners, photos and sponsors for that edition |

## 1. Brand and colours
- Name, headline, emails, socials: `src/config/site.ts`. The brand name and headline can also be changed live in **Admin → Settings**.
- Palettes: `src/config/palettes.ts` (*Neural night* is the default; *Aurora* and *Solar flare* are also included). Switch between them live in **Admin → Settings**.
- Logo mark: `Mark` in `src/components/Nav.tsx` and `public/favicon.svg`.
- Tracks (AI, FinTech, …): **Admin → Tracks**, up to 6. Their order decides which part of the brain each one lights.

## 2. Supabase (about 10 minutes)
1. Create a free project at supabase.com (Singapore or Mumbai is closest to Nepal).
2. SQL Editor → paste `supabase/schema.sql` → Run. This creates the tables, the security rules, the `media` bucket, Edition 01, the 5 tracks and the FAQ.
3. Authentication → Users → **Add user** (your email and a password).
4. SQL Editor: `insert into public.admins (email) values ('you@yourdomain.com');`
5. Authentication → URL Configuration: set Site URL to `https://your-domain`.
6. Project Settings → API: copy the Project URL and the anon key into `.env` (see `.env.example`).

**CORS:** Supabase accepts browser requests from any domain, so nothing needs configuring. The anon key is public by design; the row-level security rules in `schema.sql` protect the data.

**Free plan:** 500 MB database, 1 GB file storage. Free projects pause after a week without activity, so `.github/workflows/keep-alive.yml` queries the database every 3 days. Photos are shrunk to WebP in the browser before upload, and videos stay on YouTube.

## 3. Deploy (GitHub Pages + your domain)
1. Push to a GitHub repo (branch `main`).
2. Settings → Secrets and variables → Actions: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Settings → Pages → Source: **GitHub Actions**.
4. Settings → Pages → Custom domain. At your DNS provider, add a `CNAME` record pointing to `<user>.github.io` (for a subdomain), or the four GitHub `A` records (for the root domain). Then tick **Enforce HTTPS**.

## 4. Running an edition from `/admin`
Editions (status, current, registration open or closed, team size, fee, timeline, prizes, problem, winners) · Registrations (search, CSV export for Excel) · Tracks · Sponsors (tiers: title, powered by, gold, sponsor, industry partner, community) · Gallery (photos and YouTube) · FAQ · Settings.

## Performance and accessibility
- Never more than 3 WebGL canvases, and each renders only while on screen.
- Fewer neurons and particles on phones.
- If WebGL is unavailable, the page falls back to a gradient.
- Respects "reduce motion".
- No post-processing: bloom blacked out the screen on some GPUs, so the glow comes from additive light instead.
- Shaders avoid undefined GLSL (no `pow()` of negative numbers, no reversed `smoothstep`), so they render the same on every GPU.

React Bits components are used under their MIT + Commons Clause licence, which allows use inside a website.
