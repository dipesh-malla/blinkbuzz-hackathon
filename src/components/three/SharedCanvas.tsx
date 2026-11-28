import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { View, PerformanceMonitor } from '@react-three/drei';

/** Sections that draw into this canvas. */
const GL_SECTIONS = ['orbit', 'register'];

/**
 * Renders only while one of the 3D sections is on screen. Before, this full-screen
 * canvas redrew every frame even while the visitor was reading other sections, and
 * together with the hero scene that is what made scrolling feel choppy.
 */
function RenderGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
        if (seen.size) setFrameloop('always');
        else {
          setFrameloop('never');
          gl.clear(); // don't leave the last 3D frame painted on the fixed layer
        }
      },
      { rootMargin: '120px 0px' },
    );
    const watch = () => GL_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    watch();
    // sections can mount after the canvas (data loads), so look again shortly
    const t = window.setTimeout(watch, 1500);
    setFrameloop('never');
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [setFrameloop, gl]);
  return null;
}

/**
 * One fixed, full-screen WebGL canvas that draws every small 3D "View"
 * on the page (the editions orbit, the registration terrain).
 * Sharing one context keeps phones well under their WebGL limit.
 */
export default function SharedCanvas({ lowPower }: { lowPower: boolean }) {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.5));
  return (
    <Canvas
      eventSource={document.getElementById('root') ?? undefined}
      className="!pointer-events-none !fixed !inset-0 z-0"
      dpr={dpr}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
      aria-hidden
    >
      <RenderGate />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(lowPower ? 1.25 : 1.5)} flipflops={3} />
      <View.Port />
    </Canvas>
  );
}
