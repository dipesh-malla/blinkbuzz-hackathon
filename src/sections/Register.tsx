import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Stepper, { Step } from '../components/reactbits/Stepper';
import { Arrow, Fact, useReveal } from '../components/ui';
import { useSite } from '../lib/store';
import { feeLabel, newId, submitRegistration, teamLabel } from '../lib/data';
import { useMediaQuery, usePalette } from '../hooks/usePalette';
import type { Member, Registration } from '../lib/types';

const RegisterTerrain = lazy(() => import('../components/three/RegisterTerrain'));

const emptyMember = (): Member => ({ name: '', email: '', phone: '', grade: '' });
const DRAFT_KEY = 'reg-draft-v1';

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
const isPhone = (s: string) => /^(\+?977[-\s]?)?9[678]\d{8}$/.test(s.replace(/[\s-]/g, ''));

const districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavrepalanchok', 'Chitwan', 'Kaski', 'Morang', 'Sunsari', 'Rupandehi', 'Jhapa'];

type Draft = Omit<Registration, 'edition_id'>;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-[13px] text-[#ff6b6b]">{error}</span>}
    </label>
  );
}

export default function Register({ gl }: { gl: boolean }) {
  const sec = useReveal<HTMLElement>();
  const mobileGl = useMediaQuery('(max-width: 767px)');
  const { current: e, contactEmail } = useSite();
  const palette = usePalette();
  const minM = Math.max(1, e?.team_min ?? 1);
  const maxM = Math.max(minM, e?.team_max ?? 1);
  const isTeam = maxM > 1;

  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  // one id per registration: pressing Submit again after a dropped connection can't create a duplicate
  const regId = useRef<string>(newId());
  const [sendError, setSendError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [d, setD] = useState<Draft>(() => {
    const base: Draft = {
      team_name: '',
      school: '',
      district: '',
      members: Array.from({ length: minM }, emptyMember),
      guardian_name: '',
      guardian_phone: '',
      consent: false,
    };
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      return saved ? { ...base, ...saved, consent: false } : base;
    } catch {
      return base;
    }
  });

  // keep member count within the edition's limits if an admin changes them
  useEffect(() => {
    setD((p) => {
      let m = p.members.slice(0, maxM);
      while (m.length < minM) m = [...m, emptyMember()];
      return m.length === p.members.length ? p : { ...p, members: m };
    });
  }, [minM, maxM]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, consent: false }));
    } catch {
      /* storage unavailable */
    }
  }, [d]);

  const errors = useMemo(() => {
    const er: Record<string, string> = {};
    if (isTeam && d.team_name.trim().length < 2) er.team_name = 'Give your team a name.';
    if (d.school.trim().length < 2) er.school = 'Which school or college are you from?';
    if (d.district.trim().length < 2) er.district = 'Add your district.';
    d.members.forEach((m, i) => {
      if (m.name.trim().length < 2) er[`m${i}name`] = 'Full name, please.';
      if (!isEmail(m.email)) er[`m${i}email`] = 'A valid email address.';
      if (!isPhone(m.phone)) er[`m${i}phone`] = 'A 10-digit Nepal mobile number.';
      if (!m.grade) er[`m${i}grade`] = 'Pick a grade.';
    });
    if (d.guardian_name.trim().length < 2) er.guardian_name = 'Parent or guardian’s name.';
    if (!isPhone(d.guardian_phone)) er.guardian_phone = 'A 10-digit Nepal mobile number.';
    if (!d.consent) er.consent = 'A guardian needs to agree before you can join.';
    return er;
  }, [d, isTeam]);

  const stepKeys: Record<number, (k: string) => boolean> = {
    1: (k) => ['team_name', 'school', 'district'].includes(k),
    2: (k) => k.startsWith('m'),
    3: (k) => k.startsWith('guardian') || k === 'consent',
    4: () => false,
  };
  const stepValid = (s: number) => !Object.keys(errors).some(stepKeys[s]);
  const err = (k: string) => (tried ? errors[k] : undefined);

  const next = async () => {
    if (!stepValid(step)) {
      setTried(true);
      return;
    }
    setTried(false);
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (!e || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await submitRegistration({ ...d, id: regId.current, edition_id: e.id, team_name: isTeam ? d.team_name : d.members[0].name });
      setDone(true);
      setStep(5);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch (x) {
      setSendError((x as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const setMember = (i: number, patch: Partial<Member>) =>
    setD((p) => ({ ...p, members: p.members.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));

  if (!e) return null;

  return (
    <section id="register" ref={sec} className="relative overflow-hidden py-[clamp(80px,12vh,140px)]">
      {/* 3D data landscape behind the panel */}
      {gl && (
        <Suspense fallback={null}>
          <RegisterTerrain palette={palette} lowPower={mobileGl} />
        </Suspense>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_40%,var(--bg)_10%,transparent_70%)]" aria-hidden />
      <div className="wrap relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="tag mb-5" data-reveal>
            Register
          </p>
          <h2 data-reveal className="h-section">
            {e.registration_open ? (
              <>
                Register for <span className="grad-text">{e.title}.</span>
              </>
            ) : (
              <>
                Registration <span className="text-muted">opens soon.</span>
              </>
            )}
          </h2>
          <p data-reveal className="mt-5 max-w-[40ch] text-[17px] text-muted">
            Four short steps: your team, its members, a guardian, then a check. Your answers are saved on this device as you go.
          </p>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-2">
            {[teamLabel(e.team_min, e.team_max), feeLabel(e.fee_npr)].map((x) => (
              <span key={x} className="glass rounded-full px-3.5 py-1.5 text-[13px]">
                {x}
              </span>
            ))}
            <Link to={`/edition/${e.slug}`} className="link-draw ml-1 text-[14px] text-accent">
              Venue, dates and rules →
            </Link>
          </div>
        </div>

        <div data-reveal className="lg:col-span-7">
          {!e.registration_open ? (
            <div className="glass rounded-[calc(28px*var(--rk))] bg-bg/50 p-8">
              <p className="text-[20px] font-medium">Registration for {e.title} isn’t open yet.</p>
              <p className="mt-2 text-muted">Write to us and we’ll tell you the day it opens.</p>
              <a className="btn btn-primary mt-6" href={`mailto:${contactEmail}?subject=Notify me: ${e.title}`}>
                Notify me <Arrow />
              </a>
            </div>
          ) : (
            <div className="glass rounded-[calc(28px*var(--rk))] bg-bg/55 p-4 sm:p-6 md:p-8">
              <Stepper
                step={step}
                onStepChange={(s) => {
                  // indicators: only allow going back, or forward through valid steps
                  if (s < step || [...Array(s - 1)].every((_, i) => stepValid(i + 1))) setStep(s);
                }}
                linear
                showFooter={false}
                frame={false}
                width="100%"
                theme={palette.scheme}
                accentColor={palette.accent}
                indicator="numbers"
                style={
                  {
                    '--stepper-tile': `linear-gradient(180deg, color-mix(in oklab, ${palette.ink} 12%, ${palette.surface}) 0%, ${palette.surface} 100%)`,
                    '--stepper-well': `color-mix(in oklab, ${palette.ink} 6%, transparent)`,
                    '--stepper-ink': palette.ink,
                    '--stepper-solid': palette.ink,
                    '--stepper-solid-ink': palette.bg,
                  } as React.CSSProperties
                }
                completedContent={
                  <div className="py-10 text-center" role="status">
                    <p className="eyebrow text-accent">Registered</p>
                    <p className="mx-auto mt-4 max-w-[22ch] text-[28px] font-medium tracking-[-0.02em]">
                      {isTeam ? `${d.team_name} is in.` : 'You’re in.'} See you at {e.venue?.split(',')[0] ?? 'the venue'}.
                    </p>
                    <p className="mx-auto mt-3 max-w-[40ch] text-muted">We’ll email every member with the problem-day details.</p>
                  </div>
                }
              >
                <Step title="Team">
                  <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
                    {isTeam && (
                      <div className="sm:col-span-2">
                        <Field label="Team name" error={err('team_name')}>
                          <input className="field" value={d.team_name} aria-invalid={!!err('team_name')} onChange={(x) => setD({ ...d, team_name: x.target.value })} autoComplete="off" />
                        </Field>
                      </div>
                    )}
                    <Field label="School or college" error={err('school')}>
                      <input className="field" value={d.school} aria-invalid={!!err('school')} onChange={(x) => setD({ ...d, school: x.target.value })} autoComplete="organization" />
                    </Field>
                    <Field label="District" error={err('district')}>
                      <input className="field" list="districts" value={d.district} aria-invalid={!!err('district')} onChange={(x) => setD({ ...d, district: x.target.value })} />
                      <datalist id="districts">
                        {districts.map((x) => (
                          <option key={x} value={x} />
                        ))}
                      </datalist>
                    </Field>
                  </div>
                </Step>

                <Step title="Members">
                  <div className="space-y-6 pt-6">
                    {d.members.map((m, i) => (
                      <fieldset key={i} className="rounded-2xl border border-line p-4 sm:p-5">
                        <legend className="px-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                          {isTeam ? (i === 0 ? 'Member 1 · team lead' : `Member ${i + 1}`) : 'Your details'}
                        </legend>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Full name" error={err(`m${i}name`)}>
                            <input className="field" value={m.name} aria-invalid={!!err(`m${i}name`)} onChange={(x) => setMember(i, { name: x.target.value })} autoComplete={i === 0 ? 'name' : 'off'} />
                          </Field>
                          <Field label="Grade" error={err(`m${i}grade`)}>
                            <select className="field" value={m.grade} aria-invalid={!!err(`m${i}grade`)} onChange={(x) => setMember(i, { grade: x.target.value })}>
                              <option value="">Select</option>
                              <option>Grade 9</option>
                              <option>Grade 10</option>
                              <option>Grade 11</option>
                              <option>Grade 12</option>
                            </select>
                          </Field>
                          <Field label="Email" error={err(`m${i}email`)}>
                            <input className="field" type="email" inputMode="email" value={m.email} aria-invalid={!!err(`m${i}email`)} onChange={(x) => setMember(i, { email: x.target.value })} autoComplete={i === 0 ? 'email' : 'off'} />
                          </Field>
                          <Field label="Mobile" error={err(`m${i}phone`)}>
                            <input className="field" type="tel" inputMode="tel" placeholder="98XXXXXXXX" value={m.phone} aria-invalid={!!err(`m${i}phone`)} onChange={(x) => setMember(i, { phone: x.target.value })} autoComplete={i === 0 ? 'tel' : 'off'} />
                          </Field>
                        </div>
                        {isTeam && d.members.length > minM && i > 0 && (
                          <button className="mt-4 text-[14px] text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setD({ ...d, members: d.members.filter((_, j) => j !== i) })}>
                            Remove member
                          </button>
                        )}
                      </fieldset>
                    ))}
                    {isTeam && d.members.length < maxM && (
                      <button className="btn btn-ghost w-full" onClick={() => setD({ ...d, members: [...d.members, emptyMember()] })}>
                        Add member ({d.members.length}/{maxM})
                      </button>
                    )}
                  </div>
                </Step>

                <Step title="Guardian">
                  <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
                    <Field label="Parent or guardian’s name" error={err('guardian_name')}>
                      <input className="field" value={d.guardian_name} aria-invalid={!!err('guardian_name')} onChange={(x) => setD({ ...d, guardian_name: x.target.value })} />
                    </Field>
                    <Field label="Guardian’s mobile" error={err('guardian_phone')}>
                      <input className="field" type="tel" inputMode="tel" placeholder="98XXXXXXXX" value={d.guardian_phone} aria-invalid={!!err('guardian_phone')} onChange={(x) => setD({ ...d, guardian_phone: x.target.value })} />
                    </Field>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 sm:col-span-2">
                      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" checked={d.consent} onChange={(x) => setD({ ...d, consent: x.target.checked })} />
                      <span className="text-[15px]">
                        My parent or guardian agrees to my taking part in {e.title} at {e.venue ?? 'the venue'}, and to being contacted on the day.
                        {err('consent') && <span className="mt-1.5 block text-[13px] text-[#ff6b6b]">{err('consent')}</span>}
                      </span>
                    </label>
                  </div>
                </Step>

                <Step title="Check">
                  <div className="pt-6">
                    <dl>
                      {isTeam && <Fact k="Team" v={d.team_name} />}
                      <Fact k="School" v={`${d.school}, ${d.district}`} />
                      {d.members.map((m, i) => (
                        <Fact key={i} k={isTeam ? `Member ${i + 1}` : 'Name'} v={`${m.name} · ${m.grade}`} />
                      ))}
                      <Fact k="Guardian" v={`${d.guardian_name} · ${d.guardian_phone}`} />
                    </dl>
                    {sendError && <p className="mt-4 text-[14px] text-[#ff6b6b]">{sendError}</p>}
                  </div>
                </Step>
              </Stepper>

              {!done && (
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
                  <button className={`btn btn-ghost ${step === 1 ? 'invisible' : ''}`} onClick={() => setStep(Math.max(1, step - 1))}>
                    Back
                  </button>
                  <div className="flex items-center gap-4">
                    {tried && !stepValid(step) && <span className="hidden text-[13px] text-[#ff6b6b] sm:inline">Check the fields above.</span>}
                    <button className="btn btn-primary" onClick={next} disabled={sending}>
                      {step < 4 ? 'Continue' : sending ? 'Saving…' : 'Submit registration'} <Arrow />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
