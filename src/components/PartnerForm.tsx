import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { stopScroll } from '../hooks/useSmoothScroll';
import { newId, submitSponsorRequest } from '../lib/data';
import { useSite } from '../lib/store';
import type { RequestTier } from '../lib/types';
import { Arrow } from './ui';

export const interestLabel: Record<RequestTier, string> = {
  title: 'Title sponsor',
  powered: 'Powered by',
  gold: 'Gold sponsor',
  sponsor: 'Sponsor',
  partner: 'Industry partner',
  community: 'Community partner',
  'not-sure': 'Not sure yet, let’s talk',
};

type Form = { company: string; contact_name: string; email: string; phone: string; website: string; tier_interest: RequestTier; message: string };
const blank: Form = { company: '', contact_name: '', email: '', phone: '', website: '', tier_interest: 'sponsor', message: '' };

/** "Become a partner" dialog. Saves to sponsor_requests; the team gets an email. */
export default function PartnerForm({ open, onClose, initialTier }: { open: boolean; onClose: () => void; initialTier?: RequestTier }) {
  const { current, sponsorEmail } = useSite();
  const [f, setF] = useState<Form>(blank);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const reqId = useRef(newId());
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialTier) setF((v) => ({ ...v, tier_interest: initialTier }));
    stopScroll(true);
    const t = setTimeout(() => first.current?.focus(), 60);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => {
      clearTimeout(t);
      stopScroll(false);
      window.removeEventListener('keydown', k);
    };
  }, [open, onClose, initialTier]);

  // after a sent request, the next open starts a fresh form
  useEffect(() => {
    if (!open && state === 'done') {
      setF(blank);
      setState('idle');
      setTouched(false);
      reqId.current = newId();
    }
  }, [open, state]);

  if (!open) return null;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(f.email.trim());
  const bad = {
    company: f.company.trim().length < 2,
    contact_name: f.contact_name.trim().length < 2,
    email: !emailOk,
  };
  const valid = !bad.company && !bad.contact_name && !bad.email;
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || state === 'sending') return;
    setState('sending');
    setErr(null);
    let website = f.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      await submitSponsorRequest({
        id: reqId.current,
        company: f.company.trim(),
        contact_name: f.contact_name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || null,
        website: website || null,
        tier_interest: f.tier_interest,
        message: f.message.trim() || null,
      });
      setState('done');
    } catch (x) {
      setErr((x as Error).message);
      setState('idle');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-bg/80 p-4 backdrop-blur-xl" role="dialog" aria-modal aria-labelledby="partner-title" onClick={onClose} data-lenis-prevent>
      <div className="glass relative my-8 w-full max-w-[640px] rounded-[calc(26px*var(--rk))] p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:text-ink" aria-label="Close">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {state === 'done' ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'color-mix(in oklab, var(--accent) 22%, transparent)' }}>
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 id="partner-title" className="mt-5 text-[26px] font-medium tracking-[-0.02em]">Thanks, {f.contact_name.split(' ')[0]}.</h3>
            <p className="mx-auto mt-2 max-w-[40ch] text-muted">We’ve got your request for {f.company}. Someone from our team will reach out at {f.email} soon.</p>
            <button className="btn btn-primary mt-7" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="eyebrow">Partner with us</p>
            <h3 id="partner-title" className="mt-2 pr-10 text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.025em]">
              Back {current?.title ?? 'the next edition'}
            </h3>
            <p className="mt-2 text-[15px] text-muted">Tell us a little about you. We’ll reply with the deck and open slots.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Company or organisation *</span>
                <input ref={first} className="field" value={f.company} onChange={set('company')} maxLength={120} aria-invalid={touched && bad.company} autoComplete="organization" />
              </label>
              <label className="block">
                <span className="label">Your name *</span>
                <input className="field" value={f.contact_name} onChange={set('contact_name')} maxLength={120} aria-invalid={touched && bad.contact_name} autoComplete="name" />
              </label>
              <label className="block">
                <span className="label">Email *</span>
                <input className="field" type="email" value={f.email} onChange={set('email')} maxLength={200} aria-invalid={touched && bad.email} autoComplete="email" />
              </label>
              <label className="block">
                <span className="label">Phone</span>
                <input className="field" type="tel" value={f.phone} onChange={set('phone')} maxLength={40} autoComplete="tel" />
              </label>
              <label className="block">
                <span className="label">Website</span>
                <input className="field" value={f.website} onChange={set('website')} maxLength={300} placeholder="yourcompany.com" autoComplete="url" />
              </label>
              <label className="block">
                <span className="label">Interested in</span>
                <select className="field" value={f.tier_interest} onChange={set('tier_interest')}>
                  {Object.entries(interestLabel).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Message</span>
                <textarea className="field" rows={4} value={f.message} onChange={set('message')} maxLength={2000} placeholder="What would you like to support? A prize, a track, mentors, the venue…" />
              </label>
            </div>

            {touched && !valid && <p className="mt-4 text-[14px] text-[#ff6b6b]">Please fill in your company, your name and a valid email.</p>}
            {err && <p className="mt-4 text-[14px] text-[#ff6b6b]">{err}</p>}

            <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="font-mono text-[12px] text-muted">
                Or email <a className="link-draw text-ink" href={`mailto:${sponsorEmail}`}>{sponsorEmail}</a>
              </p>
              <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send request'} <Arrow />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
