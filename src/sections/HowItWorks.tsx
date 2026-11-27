import { useState } from 'react';
import { Section } from '../components/ui';
import StepIcon, { type StepKind } from '../components/StepIcon';
import { useSite } from '../lib/store';
import { feeLabel, teamLabel } from '../lib/data';

// `gl` is kept so Home can pass it; the steps no longer need WebGL.
export default function HowItWorks(_props: { gl?: boolean }) {
  const { current } = useSite();
  const [hover, setHover] = useState(-1);
  const team = current ? teamLabel(current.team_min, current.team_max).replace(' members', '') : '2–4';
  const fee = current ? feeLabel(current.fee_npr) : 'Free';

  const steps = [
    {
      title: 'Register your team',
      text: `Teams of ${team} sign up here. Entry is ${fee.toLowerCase() === 'free' ? 'free' : fee}, and a guardian signs off for students under 18.`,
      kind: 'register' as StepKind,
    },
    {
      title: 'The problem drops',
      text: 'On reveal day the industry partner opens one sealed brief, and every team sees it at the same moment.',
      kind: 'reveal' as StepKind,
    },
    {
      title: 'Build the answer',
      text: 'Teams turn the brief into a working prototype, with people from the industry in the room to ask.',
      kind: 'build' as StepKind,
    },
    {
      title: 'Demo and judging',
      text: 'Every team demos to the partner’s judges. The strongest answers take the prizes.',
      kind: 'judge' as StepKind,
    },
  ];

  return (
    <Section id="how" tag="How it works">
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <h2 data-reveal className="h-section lg:col-span-7">
          From sign-up to stage <span className="text-muted">in four steps.</span>
        </h2>
        <p data-reveal className="lead lg:col-span-5 lg:justify-self-end">
          Every edition runs the same way, whatever the industry.
        </p>
      </div>

      <ol className="head-gap grid grid-cols-1 overflow-hidden rounded-[calc(28px*var(--rk))] border border-line sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ title, text, kind }, i) => (
          <li
            key={title}
            data-reveal={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            className="group relative flex flex-col border-line bg-[radial-gradient(120%_70%_at_30%_0%,color-mix(in_oklab,var(--accent2)_12%,transparent),transparent_70%)] p-7 max-sm:border-b sm:max-xl:[&:nth-child(-n+2)]:border-b sm:[&:nth-child(odd)]:border-r md:p-9 xl:border-r xl:last:border-r-0"
          >
            <div className="flex items-start justify-between">
              <StepIcon kind={kind} active={hover === i} />
              <span className="font-mono text-[13px] tracking-[0.08em] text-muted transition-colors group-hover:text-accent">0{i + 1}</span>
            </div>
            <h3 className="h-card mt-9">{title}</h3>
            <p className="body-sm mt-3 max-w-[34ch]">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
