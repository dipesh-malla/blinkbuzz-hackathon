import { Link } from 'react-router-dom';

import { useSeo } from '../lib/seo';

export default function NotFound() {
  useSeo({ title: 'Page not found | BlinkBuzz Hackathon', description: 'This page does not exist.', path: '/404', noindex: true });
  return (
    <div className="wrap grid min-h-svh place-items-center text-center">
      <div>
        <p className="font-mono text-[clamp(96px,18vw,220px)] leading-none tracking-[-0.06em] text-accent">404</p>
        <p className="mt-4 text-[20px] text-muted">This page drifted out of orbit.</p>
        <Link to="/" className="btn btn-primary mt-8">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
