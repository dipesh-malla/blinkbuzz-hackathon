import { useState } from 'react';
import { View } from '@react-three/drei';
import { Section } from '../components/ui';
import { Badge, Chip, SealedCube, Trophy } from '../components/three/StepObjects';
import { usePalette } from '../hooks/usePalette';
import { useSite } from '../lib/store';
import { feeLabel, teamLabel } from '../lib/data';

export default function HowItWorks({ gl }: { gl: boolean }) {
  const { current } = useSite();
  const palette = usePalette();
  const [hover, setHover] = useState(-1);
  const team = current ? teamLabel(current.team_min, current.team_max).replace(' members', '') : '2–4';
  const fee = current ? feeLabel(current.fee_npr) : 'Free';

  const steps = [
    {
      title: 'Register your team',
      text: `Teams of ${team} sign up here. Entry is ${fee.toLowerCase() === 'free' ? 'free' : fee}, and a guardian signs off for students under 18.`,
      Obj: Badge,
    },
    {
      title: 'The problem drops',
      text: 'On reveal day the industry partner opens one sealed brief, and every team sees it at the same moment.',
      Obj: SealedCube,
    },
    {
      title: 'Build the answer',
      text: 'Teams turn the brief into a working prototype, with people from the industry in the room to ask.',
      Obj: Chip,
    },
    {
      title: 'Demo and judging',
      text: 'Every team demos to the partner’s judges. The strongest answers take the prizes.',
      Obj: Trophy,
    },
  ];

  return (
    <Section id="how" tag="How it works">
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <h2 data-reveal className="h-section lg:col-span-7">
          From sign-up to stage <span className="text-muted">in four steps.</span>
        </h2>
        <p data-reveal className="max-w-[44ch] text-[16px] text-muted lg:col-span-5 lg:justify-self-end">
          Every edition runs the same way, whatever the industry.
        </p>
      </div>

      <ol className="mt-14 grid grid-cols-1 overflow-hidden rounded-[28px] border border-line sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ title, text, Obj }, i) => (
          <li
            key={title}
            data-reveal={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
            className="group relative border-line bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_oklab,var(--accent2)_14%,transparent),transparent_70%)] p-6 max-sm:border-b sm:max-xl:[&:nth-child(-n+2)]:border-b sm:[&:nth-child(odd)]:border-r xl:border-r xl:last:border-r-0 md:p-8"
          >
            <span className="font-mono text-[12px] text-accent">0{i + 1}</span>
            <div className="relative mx-auto mt-2 h-[190px] w-full max-w-[260px]">
              {gl ? (
                <View className="absolute inset-0">
                  <Obj palette={palette} hover={hover === i} />
                </View>
              ) : null}
            </div>
            <h3 className="mt-4 text-[21px] font-medium tracking-[-0.02em]">{title}</h3>
            <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
