import { useState } from 'react';
import { Section } from '../components/ui';
import { useSite } from '../lib/store';

export default function Faq() {
  const { faqs, contactEmail } = useSite();
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <Section id="faq" tag="Questions">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 data-reveal className="h-section">
            Before you <span className="text-muted">register.</span>
          </h2>
          <p data-reveal className="mt-5 max-w-[36ch] text-[17px] text-muted">
            Something not covered? Write to{' '}
            <a className="link-draw text-ink" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
            .
          </p>
        </div>
        <ul className="glass rounded-[28px] px-5 md:px-8 lg:col-span-7">
          {faqs.map((f, i) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id} data-reveal={i % 3} className="border-b border-line last:border-b-0">
                <button
                  className="focus-ring flex w-full items-center justify-between gap-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${f.id}`}
                  onClick={() => setOpen(isOpen ? null : f.id)}
                >
                  <span className="text-[19px] font-medium tracking-[-0.015em]">{f.question}</span>
                  <span className="relative h-4 w-4 shrink-0" aria-hidden>
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-accent" />
                    <span className={`absolute left-1/2 top-0 h-4 w-px bg-accent transition-transform duration-300 ${isOpen ? 'scale-y-0' : ''}`} />
                  </span>
                </button>
                <div
                  id={`faq-${f.id}`}
                  className="grid transition-[grid-template-rows] duration-400 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] pb-6 text-[16px] text-muted">{f.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
