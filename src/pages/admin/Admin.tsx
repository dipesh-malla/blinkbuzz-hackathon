import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useSite } from '../../lib/store';
import { Logo } from '../../components/Nav';
import EditionsAdmin from './EditionsAdmin';
import RegistrationsAdmin from './RegistrationsAdmin';
import SponsorsAdmin from './SponsorsAdmin';
import MediaAdmin from './MediaAdmin';
import FaqAdmin from './FaqAdmin';
import SettingsAdmin from './SettingsAdmin';
import TracksAdmin from './TracksAdmin';

const tabs = [
  { id: 'registrations', label: 'Registrations', C: RegistrationsAdmin },
  { id: 'editions', label: 'Editions', C: EditionsAdmin },
  { id: 'tracks', label: 'Tracks', C: TracksAdmin },
  { id: 'sponsors', label: 'Sponsors', C: SponsorsAdmin },
  { id: 'media', label: 'Gallery', C: MediaAdmin },
  { id: 'faq', label: 'FAQ', C: FaqAdmin },
  { id: 'settings', label: 'Settings', C: SettingsAdmin },
] as const;

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  const { brand } = useSite();
  return (
    <div className="min-h-svh">
      <header className="border-b border-line">
        <div className="wrap flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo brand={brand} />
            <span className="eyebrow">Admin</span>
          </Link>
          {onSignOut && (
            <button className="btn btn-ghost h-9 px-4 text-[14px]" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('registrations');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(null);
      return;
    }
    supabase
      .from('admins')
      .select('email')
      .eq('email', session.user.email ?? '')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!supabase)
    return (
      <Shell>
        <div className="wrap max-w-2xl py-16">
          <h1 className="h-section text-[40px]">Connect Supabase first.</h1>
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-muted">
            <li>Create a free project at supabase.com.</li>
            <li>Run supabase/schema.sql in its SQL editor.</li>
            <li>
              Put <code className="text-ink">VITE_SUPABASE_URL</code> and <code className="text-ink">VITE_SUPABASE_ANON_KEY</code> in <code className="text-ink">.env</code>{' '}
              (and in the GitHub repository secrets for deploys).
            </li>
            <li>Create your user in Authentication, then add your email to the admins table.</li>
          </ol>
          <p className="mt-6 text-muted">The public site runs on demo content until then. See README.md.</p>
        </div>
      </Shell>
    );

  if (checking) return <Shell><div className="wrap py-16 text-muted">Checking session…</div></Shell>;
  if (!session) return <Shell><Login /></Shell>;

  const signOut = () => supabase!.auth.signOut();

  if (isAdmin === false)
    return (
      <Shell onSignOut={signOut}>
        <div className="wrap py-16">
          <p className="text-[20px]">{session.user.email} isn’t on the admin list.</p>
          <p className="mt-2 text-muted">Ask an existing admin to add your email to the admins table.</p>
        </div>
      </Shell>
    );

  const Active = tabs.find((t) => t.id === tab)!.C;
  return (
    <Shell onSignOut={signOut}>
      <div className="wrap py-8">
        <div className="-mx-[var(--edge)] flex gap-2 overflow-x-auto px-[var(--edge)] pb-2 [scrollbar-width:none]" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 shrink-0 rounded-full border px-4 text-[14px] transition-colors ${
                tab === t.id ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-8">{isAdmin ? <Active /> : <p className="text-muted">Loading…</p>}</div>
      </div>
    </Shell>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="wrap grid min-h-[70svh] place-items-center">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const { error } = await supabase!.auth.signInWithPassword({ email, password });
          if (error) setErr(error.message);
          setBusy(false);
        }}
      >
        <h1 className="text-[28px] font-medium tracking-[-0.02em]">Organiser login</h1>
        <label className="block">
          <span className="label">Email</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <div>
          <label className="label" htmlFor="admin-password">
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
              className="field pr-12"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
              title={show ? 'Hide password' : 'Show password'}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {show && <path d="M4 4l16 16" />}
              </svg>
            </button>
          </div>
        </div>
        {err && <p className="text-[14px] text-[#ff6b6b]">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
