import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Nav from '../components/Nav';
import Loader from '../components/Loader';
import Hero from '../sections/Hero';
import HowItWorks from '../sections/HowItWorks';
import Tracks from '../sections/Tracks';
import Editions from '../sections/Editions';
import Showcase from '../sections/Showcase';
import Gallery from '../sections/Gallery';
import Sponsors from '../sections/Sponsors';
import Faq from '../sections/Faq';
import Register from '../sections/Register';
import Footer from '../sections/Footer';
import { scrollToId, useSmoothScroll } from '../hooks/useSmoothScroll';
import { hasWebGL, useMediaQuery } from '../hooks/usePalette';
import { useSite } from '../lib/store';
import { SITE_URL, OG_IMAGE, useSeo } from '../lib/seo';
import { formatDate } from '../lib/data';

const SharedCanvas = lazy(() => import('../components/three/SharedCanvas'));

export default function Home() {
  useSmoothScroll();
  const { loading, error, current, faqs } = useSite();
  useSeo({
    title: 'BlinkBuzz Hackathon Nepal | Student Hackathon for Grade 9–12 at TechSpire College',
    description:
      'BlinkBuzz Hackathon is a student hackathon series in Kathmandu, Nepal. Edition 01 at TechSpire College is free for Grade 9–12 students: teams of 2–4 solve one real industry problem in AI, FinTech, HealthTech, Robotics and more.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        ...(faqs.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
              },
            ]
          : []),
        ...(current?.starts_at
          ? [
              {
                '@type': 'Event',
                name: `BlinkBuzz Hackathon ${current.title}`,
                description: `${current.audience}. ${current.venue ?? 'Kathmandu'}, ${formatDate(current.starts_at)}.`,
                startDate: current.starts_at,
                endDate: current.ends_at ?? current.starts_at,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                image: [OG_IMAGE],
                url: `${SITE_URL}/edition/${current.slug}/`,
                location: { '@type': 'Place', name: current.venue ?? 'Kathmandu', address: { '@type': 'PostalAddress', addressLocality: 'Kathmandu', addressCountry: 'NP' } },
                organizer: { '@type': 'Organization', name: 'BlinkBuzz', url: SITE_URL },
                offers: { '@type': 'Offer', price: current.fee_npr, priceCurrency: 'NPR', availability: 'https://schema.org/InStock', url: `${SITE_URL}/#register` },
              },
            ]
          : []),
      ],
    },
  });
  const { hash } = useLocation();
  const [gl] = useState(hasWebGL);
  const mobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (loading) return;
    // content height changes once data arrives: re-measure scroll triggers
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
      if (hash) scrollToId(hash.slice(1));
    }, 150);
    return () => clearTimeout(t);
  }, [loading, hash]);

  return (
    <>
      <Loader />
      <Nav />
      <main className="relative z-[1]">
        <Hero />
        {error && <div className="wrap py-6 text-[14px] text-[#ff6b6b]">Couldn’t load the latest event data ({error}). Please refresh.</div>}
        {!loading && (
          <>
            <HowItWorks gl={gl} />
            <Tracks />
            <Editions />
            <Showcase />
            <Gallery />
            <Sponsors />
            <Register gl={gl} />
            <Faq />
          </>
        )}
      </main>
      <div className="relative z-[1]">
        <Footer />
      </div>
      {gl && !loading && (
        <Suspense fallback={null}>
          <SharedCanvas lowPower={mobile} />
        </Suspense>
      )}
    </>
  );
}
