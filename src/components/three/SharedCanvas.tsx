import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';

/**
 * One fixed, full-screen WebGL canvas that draws every small 3D "View"
 * on the page (the how-it-works objects, the registration terrain).
 * Sharing one context keeps phones well under their WebGL limit.
 */
export default function SharedCanvas({ lowPower }: { lowPower: boolean }) {
  return (
    <Canvas
      eventSource={document.getElementById('root') ?? undefined}
      className="!pointer-events-none !fixed !inset-0 z-0"
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
      aria-hidden
    >
      <View.Port />
    </Canvas>
  );
}
