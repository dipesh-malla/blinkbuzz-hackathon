import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Fades + lifts every [data-reveal] child in once, as it scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current);
      items.forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            delay: Number(el.dataset.reveal || 0) * 0.08,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        );
      });
    },
    { scope: ref },
  );
  return ref;
}

export function Section({
  id,
  tag,
  children,
  className = '',
  tall = false,
  bare = false,
}: {
  id: string;
  tag?: string;
  children: ReactNode;
  className?: string;
  tall?: boolean;
  bare?: boolean; // no wrap: the section handles its own width
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id={id} ref={ref} className={`relative ${tall ? 'min-h-[100svh]' : ''} py-[clamp(80px,12vh,140px)] ${className}`}>
      {bare ? (
        children
      ) : (
        <div className="wrap">
          {tag && (
            <p className="tag mb-5" data-reveal>
              {tag}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className={className} aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Fact({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
      <dt className="text-[14px] text-muted">{k}</dt>
      <dd className="text-right text-[15px] font-medium">{v}</dd>
    </div>
  );
}
