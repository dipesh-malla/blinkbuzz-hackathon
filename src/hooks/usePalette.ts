import { useEffect, useState } from 'react';
import { currentPalette, type Palette } from '../config/palettes';

export function usePalette(): Palette {
  const [p, setP] = useState<Palette>(() => currentPalette());
  useEffect(() => {
    const on = (e: Event) => setP((e as CustomEvent<Palette>).detail);
    window.addEventListener('palette-change', on);
    setP(currentPalette());
    return () => window.removeEventListener('palette-change', on);
  }, []);
  return p;
}

export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '200px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    on();
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
