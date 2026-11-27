import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EditionPage from './pages/EditionPage';
import NotFound from './pages/NotFound';

const Admin = lazy(() => import('./pages/admin/Admin'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edition/:slug" element={<EditionPage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="grid min-h-svh place-items-center text-muted">Loading admin…</div>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
