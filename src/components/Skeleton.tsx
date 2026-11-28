/**
 * Loading placeholders in the shape of the real content, so the page never sits blank
 * and nothing jumps when the data arrives. A soft shimmer runs across them
 * (.sk in index.css; it stops for reduced motion).
 */
export function Sk({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={`sk block rounded-[calc(10px*var(--rk))] ${className}`} style={style} />;
}

function Head() {
  return (
    <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Sk className="h-4 w-28" />
        <Sk className="mt-6 h-[clamp(36px,4.6vw,68px)] w-[85%]" />
        <Sk className="mt-3 h-[clamp(36px,4.6vw,68px)] w-[55%]" />
      </div>
      <div className="lg:col-span-5 lg:justify-self-end">
        <Sk className="h-4 w-[min(360px,80vw)]" />
        <Sk className="mt-2.5 h-4 w-[min(300px,70vw)]" />
      </div>
    </div>
  );
}

/** Stand-ins for the sections below the hero, shown on a first visit while data loads. */
export function SectionsSkeleton() {
  return (
    <div role="status" aria-label="Loading the event details">
      <section className="wrap py-[var(--section-y)]">
        <Head />
        <div className="head-gap grid grid-cols-1 gap-px overflow-hidden rounded-[calc(28px*var(--rk))] border border-line sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-7 md:p-9">
              <Sk className="h-[148px] w-[148px] rounded-[calc(26px*var(--rk))]" />
              <Sk className="mt-9 h-6 w-2/3" />
              <Sk className="mt-4 h-3.5 w-full" />
              <Sk className="mt-2 h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      </section>
      <section className="wrap py-[var(--section-y)]">
        <Head />
        <div className="head-gap grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Sk className="h-[420px] rounded-[calc(26px*var(--rk))] sm:col-span-2 lg:row-span-2" />
          {[0, 1, 2, 3].map((i) => (
            <Sk key={i} className="h-[200px] rounded-[calc(26px*var(--rk))]" />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Full-page placeholder for a page that is still downloading (edition pages, admin). */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="min-h-svh">
      <div className="wrap flex h-[var(--nav-h)] items-center justify-between">
        <Sk className="h-8 w-36" />
        <Sk className="h-10 w-28 rounded-full" />
      </div>
      <div className="wrap pt-[clamp(80px,14vh,160px)]">
        <Sk className="h-4 w-32" />
        <Sk className="mt-6 h-[clamp(44px,7vw,96px)] w-[70%]" />
        <Sk className="mt-3 h-[clamp(44px,7vw,96px)] w-[45%]" />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Sk key={i} className="h-40 rounded-[calc(22px*var(--rk))]" />
          ))}
        </div>
      </div>
    </div>
  );
}
