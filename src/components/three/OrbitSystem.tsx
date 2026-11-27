import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Edition } from '../../lib/types';
import type { Palette } from '../../config/palettes';

// ─────────────────────────────────────────────────────────────
//  The orbit system: the company is the sun, every edition a planet.
//  mode "hero"     → decorative, slow, sits behind the hero word
//  mode "editions" → one planet per edition, hover + click to open it
// ─────────────────────────────────────────────────────────────

type Props = {
  palette: Palette;
  mode: 'hero' | 'editions';
  editions?: Edition[];
  active?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (e: Edition) => void;
  running: boolean;
  lowPower?: boolean;
};

let glowTex: THREE.Texture | null = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

function ringPoints(r: number, seg = 160) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
  }
  return pts;
}

function Sun({ color, r }: { color: string; r: number }) {
  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    const s = r * 6.4 + Math.sin(clock.elapsedTime * 1.4) * 0.12;
    ref.current?.scale.set(s, s, 1);
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 48, 48]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite ref={ref}>
        <spriteMaterial map={glowTexture()} color={color} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight color={color} intensity={34} distance={14} decay={1.6} />
    </group>
  );
}

function Dust({ color, count }: { color: string; count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.pow(Math.random(), 0.7) * 9;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6 * (r / 6);
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={0.028} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

type PlanetSpec = {
  key: string;
  radius: number;
  size: number;
  speed: number;
  phase: number;
  look: 'solid' | 'accent' | 'ghost';
  label?: string;
  sub?: string;
  edition?: Edition;
};

function Planet({
  spec,
  palette,
  active,
  interactive,
  onHover,
  onSelect,
  labels,
}: {
  spec: PlanetSpec;
  palette: Palette;
  active: boolean;
  interactive: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (e: Edition) => void;
  labels?: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const halo = useRef<THREE.Sprite>(null);
  const [hover, setHover] = useState(false);
  const angle = useRef(spec.phase);

  useFrame(({ clock, camera, size }, dt) => {
    // slow down the hovered/active planet so it is easy to click
    const k = hover || active ? 0.15 : 1;
    angle.current += dt * spec.speed * k;
    g.current?.position.set(Math.cos(angle.current) * spec.radius, 0, Math.sin(angle.current) * spec.radius);
    if (halo.current) {
      const s = spec.size * (spec.look === 'accent' ? 5 + Math.sin(clock.elapsedTime * 2) * 0.5 : 3.6) * (hover || active ? 1.25 : 1);
      halo.current.scale.set(s, s, 1);
    }
    // project the planet to screen space and move its DOM label there
    const el = labels?.current.get(spec.key);
    if (el && g.current) {
      g.current.getWorldPosition(v);
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 34).toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = hover || active || spec.look === 'accent' ? '1' : '0.62';
    }
  });

  const color = spec.look === 'accent' ? palette.accent : palette.ink;
  const lit = hover || active;

  return (
    <group ref={g}>
      <mesh
        onPointerOver={
          interactive
            ? (e) => {
                e.stopPropagation();
                setHover(true);
                onHover?.(spec.edition?.id ?? null);
                document.body.style.cursor = 'pointer';
              }
            : undefined
        }
        onPointerOut={
          interactive
            ? () => {
                setHover(false);
                onHover?.(null);
                document.body.style.cursor = '';
              }
            : undefined
        }
        onClick={interactive && spec.edition ? () => onSelect?.(spec.edition!) : undefined}
      >
        <sphereGeometry args={[spec.size * (interactive ? 1.9 : 1), 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={spec.look === 'ghost' ? [spec.size, 10, 8] : [spec.size, 40, 40]} />
        {spec.look === 'ghost' ? (
          <meshBasicMaterial color={palette.muted} wireframe transparent opacity={lit ? 0.95 : 0.55} />
        ) : spec.look === 'accent' ? (
          <meshBasicMaterial color={palette.accent} toneMapped={false} />
        ) : (
          <meshStandardMaterial color={palette.ink} roughness={0.55} metalness={0.1} emissive={palette.ink} emissiveIntensity={0.08} />
        )}
      </mesh>
      {spec.look !== 'ghost' && (
        <sprite ref={halo}>
          <spriteMaterial map={glowTexture()} color={color} transparent opacity={spec.look === 'accent' ? 0.5 : 0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
    </group>
  );
}

function buildSpecs(mode: Props['mode'], editions: Edition[]): PlanetSpec[] {
  if (mode === 'hero') {
    return [
      { key: 'a', radius: 2.3, size: 0.16, speed: 0.32, phase: 0.6, look: 'accent' },
      { key: 'b', radius: 3.6, size: 0.22, speed: 0.2, phase: 2.6, look: 'solid' },
      { key: 'c', radius: 5.1, size: 0.18, speed: 0.13, phase: 4.4, look: 'ghost' },
      { key: 'd', radius: 6.7, size: 0.14, speed: 0.09, phase: 1.4, look: 'ghost' },
    ];
  }
  return editions.map((e, i) => {
    const look: PlanetSpec['look'] = e.status === 'planned' ? 'ghost' : e.status === 'completed' ? 'solid' : 'accent';
    return {
      key: e.id,
      radius: 1.9 + i * 1.25,
      size: look === 'accent' ? 0.24 : 0.2,
      speed: 0.42 / (1 + i * 0.55),
      phase: 0.9 + i * 2.15,
      look,
      label: String(e.number).padStart(2, '0'),
      sub: e.status === 'planned' ? 'Planned' : e.status === 'completed' ? (e.industry ?? 'Completed') : e.industry ?? 'Now open',
      edition: e,
    };
  });
}

function Rig({ tilt, interactive }: { tilt: number; interactive: boolean }) {
  const { camera, pointer } = useThree();
  const base = useMemo(() => camera.position.clone(), [camera]);
  useFrame(() => {
    const px = interactive ? pointer.x * 0.5 : pointer.x * 0.9;
    const py = interactive ? pointer.y * 0.3 : pointer.y * 0.5;
    camera.position.x += (base.x + px - camera.position.x) * 0.04;
    camera.position.y += (base.y + py + tilt - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene({ palette, mode, editions = [], active, onHover, onSelect, lowPower, labels }: Omit<Props, 'running'> & { labels: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const interactive = mode === 'editions';

  const specs = useMemo(() => {
    const all = buildSpecs(mode, editions);
    return mode === 'hero' && lowPower ? all.slice(0, 2) : all;
  }, [mode, editions, lowPower]);

  const maxR = Math.max(...specs.map((s) => s.radius), 3);
  const scale = mode === 'editions' ? Math.min(1, 4.7 / maxR) : 1;

  return (
    <>
      <ambientLight intensity={0.25} />
      <Rig tilt={0} interactive={interactive} />
      <group
        position={mode === 'hero' ? (lowPower ? [0, 1.3, 0] : [0.6, -0.75, 0]) : [0, 0, 0]}
        rotation={[0.08, 0, mode === 'hero' ? -0.22 : -0.12]}
        scale={mode === 'hero' && lowPower ? 0.62 : scale}
      >
        <Sun color={palette.accent2} r={mode === 'hero' ? 0.34 : 0.38} />
        {(mode === 'hero' ? [2.3, 3.6, 5.1, 6.7, 8.4] : specs.map((s) => s.radius)).map((r, i) => {
          const spec = mode === 'editions' ? specs[i] : undefined;
          const ghost = mode === 'hero' ? i > 1 : spec?.look === 'ghost';
          const isActive = spec?.edition && spec.edition.id === active;
          return (
            <Line
              key={r}
              points={ringPoints(r)}
              color={isActive ? palette.accent : palette.ink}
              transparent
              opacity={isActive ? 0.9 : ghost ? 0.16 : 0.3}
              lineWidth={isActive ? 1.6 : 1}
              dashed={ghost}
              dashSize={0.12}
              gapSize={0.12}
            />
          );
        })}
        {specs.map((s) => (
          <Planet
            key={s.key}
            spec={s}
            palette={palette}
            active={!!s.edition && s.edition.id === active}
            interactive={interactive}
            onHover={onHover}
            onSelect={onSelect}
            labels={labels}
          />
        ))}
        <Dust color={palette.muted} count={lowPower ? 450 : 1400} />
      </group>
    </>
  );
}

export default function OrbitSystem(props: Props) {
  const { running, mode, lowPower, palette, editions = [] } = props;
  const labels = useRef(new Map<string, HTMLDivElement>());
  const specs = useMemo(() => (mode === 'editions' ? buildSpecs(mode, editions) : []), [mode, editions]);
  return (
    <>
    <Canvas
      frameloop={running ? 'always' : 'never'}
      dpr={lowPower ? [1, 1.25] : [1, 1.75]}
      camera={{ position: mode === 'hero' ? [0, 3.4, 10.5] : [0, 5.6, 10], fov: mode === 'hero' ? 42 : 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <Scene {...props} labels={labels} />
    </Canvas>
    {specs.map((sp) => (
      <div
        key={sp.key}
        ref={(el) => {
          if (el) labels.current.set(sp.key, el);
          else labels.current.delete(sp.key);
        }}
        className="pointer-events-none absolute left-0 top-0 whitespace-nowrap text-center font-mono text-[11px] uppercase tracking-[0.08em] transition-opacity duration-300"
        style={{ color: sp.look === 'accent' ? palette.accent : palette.ink, opacity: 0, willChange: 'transform' }}
        aria-hidden
      >
        {sp.label}
        {sp.sub && <div style={{ color: palette.muted }}>{sp.sub}</div>}
      </div>
    ))}
    </>
  );
}
