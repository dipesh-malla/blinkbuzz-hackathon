import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Float, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Palette } from '../../config/palettes';

// Four small, glowing objects for the "how it works" steps.
// Built from primitives so they load instantly and cost no downloads.

type P = { palette: Palette; hover: boolean };

function Lights({ palette }: { palette: Palette }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#bfc8ff', '#1a0f3a', 1.1]} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-3, 1, 2]} intensity={18} color={palette.accent} distance={10} />
      <pointLight position={[3, -1, 2]} intensity={16} color={palette.hot} distance={10} />
      <pointLight position={[0, 3, -3]} intensity={12} color={palette.accent2} distance={10} />
    </>
  );
}

function useSpin(hover: boolean, base = 0.35) {
  const ref = useRef<THREE.Group>(null);
  const speed = useRef(base);
  useFrame((_, dt) => {
    speed.current += ((hover ? base * 4 : base) - speed.current) * Math.min(1, dt * 4);
    if (ref.current) ref.current.rotation.y += dt * speed.current;
  });
  return ref;
}

/** 01 Register: an event badge on a clip, with a code grid. */
export function Badge({ palette, hover }: P) {
  const ref = useSpin(hover);
  const code = useMemo(() => {
    const cells: [number, number][] = [];
    for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if ((x * 7 + y * 13 + x * y) % 3 !== 0) cells.push([x, y]);
    return cells;
  }, []);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.1, 4.6]} fov={32} />
      <Lights palette={palette} />
      <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
        <group ref={ref} rotation={[0.08, -0.5, 0]}>
          <RoundedBox args={[1.25, 1.7, 0.06]} radius={0.08} smoothness={4}>
            <meshPhysicalMaterial color="#2a2f6e" emissive={palette.accent2} emissiveIntensity={0.18} roughness={0.3} metalness={0.25} clearcoat={1} clearcoatRoughness={0.15} />
          </RoundedBox>
          {/* gradient header strip */}
          <mesh position={[0, 0.58, 0.032]}>
            <planeGeometry args={[1.25, 0.42]} />
            <meshBasicMaterial color={palette.accent2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.58, 0.033]}>
            <planeGeometry args={[0.62, 0.42]} />
            <meshBasicMaterial color={palette.hot} toneMapped={false} transparent opacity={0.85} />
          </mesh>
          {/* avatar ring */}
          <mesh position={[-0.33, 0.05, 0.035]}>
            <ringGeometry args={[0.13, 0.17, 40]} />
            <meshBasicMaterial color={palette.accent} toneMapped={false} />
          </mesh>
          {[0.14, 0.02, -0.1].map((y, i) => (
            <mesh key={y} position={[0.2, y, 0.035]}>
              <planeGeometry args={[i === 0 ? 0.48 : 0.36, 0.045]} />
              <meshBasicMaterial color={palette.ink} transparent opacity={i === 0 ? 0.8 : 0.35} />
            </mesh>
          ))}
          {/* code grid */}
          <group position={[-0.3, -0.52, 0.036]}>
            {code.map(([x, y]) => (
              <mesh key={`${x}-${y}`} position={[x * 0.07, y * 0.07, 0]}>
                <planeGeometry args={[0.055, 0.055]} />
                <meshBasicMaterial color={palette.accent} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {/* clip */}
          <mesh position={[0, 0.98, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.12, 0.028, 16, 40]} />
            <meshStandardMaterial color="#cfd6ff" metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[0.28, 0.06, 0.08]} />
            <meshStandardMaterial color="#cfd6ff" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </Float>
    </>
  );
}

/** 02 Problem drop: a sealed glass cube with the brief glowing inside. */
export function SealedCube({ palette, hover }: P) {
  const ref = useSpin(hover, 0.4);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (core.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.08;
      core.current.scale.setScalar(s);
      core.current.rotation.x = t * 0.7;
      core.current.rotation.z = t * 0.4;
    }
    if (ring.current) ring.current.rotation.z = t * 0.6;
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.3, 4.6]} fov={32} />
      <Lights palette={palette} />
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.5}>
        <group ref={ref} rotation={[0.5, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[1.15, 1.15, 1.15]} />
            <meshPhysicalMaterial color={palette.accent2} transparent opacity={0.18} roughness={0.05} metalness={0.1} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
            <Edges color={palette.accent} threshold={10} />
          </mesh>
          {/* seal band */}
          <mesh>
            <boxGeometry args={[1.19, 0.12, 1.19]} />
            <meshStandardMaterial color={palette.hot} emissive={palette.hot} emissiveIntensity={0.9} roughness={0.3} />
          </mesh>
          <mesh ref={core}>
            <icosahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial color={palette.accent} toneMapped={false} wireframe />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
        <group ref={ring} rotation={[1.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[1.05, 0.008, 8, 120]} />
            <meshBasicMaterial color={palette.accent} toneMapped={false} transparent opacity={0.7} />
          </mesh>
          <mesh position={[1.05, 0, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={palette.hot} toneMapped={false} />
          </mesh>
        </group>
      </Float>
    </>
  );
}

/** 03 Build: a processor with glowing traces. */
export function Chip({ palette, hover }: P) {
  const ref = useSpin(hover, 0.3);
  const scan = useRef<THREE.Mesh>(null);
  const pins = useMemo(() => {
    const out: { p: [number, number, number]; r: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const o = -0.54 + i * 0.18;
      out.push({ p: [o, 0, 0.78], r: 0 }, { p: [o, 0, -0.78], r: 0 }, { p: [0.78, 0, o], r: Math.PI / 2 }, { p: [-0.78, 0, o], r: Math.PI / 2 });
    }
    return out;
  }, []);
  const traces = useMemo(() => {
    const t: [number, number, number][][] = [];
    for (let i = 0; i < 6; i++) {
      const o = -0.45 + i * 0.18;
      t.push([[o, 0.081, 0.62], [o, 0.081, 0.34], [o * 0.4, 0.081, 0.24]]);
      t.push([[0.62, 0.081, o], [0.34, 0.081, o], [0.24, 0.081, o * 0.4]]);
    }
    return t;
  }, []);
  useFrame(({ clock }) => {
    if (scan.current) scan.current.position.z = Math.sin(clock.elapsedTime * 1.6) * 0.55;
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.5, 3.5]} rotation={[-0.62, 0, 0]} fov={34} />
      <Lights palette={palette} />
      <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
        <group ref={ref} rotation={[0, 0.6, 0]}>
          <RoundedBox args={[1.45, 0.16, 1.45]} radius={0.05} smoothness={4}>
            <meshPhysicalMaterial color="#262b5e" roughness={0.35} metalness={0.4} clearcoat={0.6} />
          </RoundedBox>
          {pins.map((p, i) => (
            <mesh key={i} position={p.p} rotation={[0, p.r, 0]}>
              <boxGeometry args={[0.07, 0.04, 0.16]} />
              <meshStandardMaterial color="#d7dcff" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {traces.map((pts, i) => (
            <TraceLine key={i} points={pts} color={i % 3 === 0 ? palette.hot : palette.accent} />
          ))}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.46, 0.05, 0.46]} />
            <meshStandardMaterial color={palette.accent2} emissive={palette.accent2} emissiveIntensity={1.2} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh ref={scan} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.46, 0.04]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.85} />
          </mesh>
        </group>
      </Float>
    </>
  );
}

function TraceLine({ points, color }: { points: [number, number, number][]; color: string }) {
  const obj = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))),
        new THREE.LineBasicMaterial({ color, toneMapped: false }),
      ),
    [points, color],
  );
  return <primitive object={obj} />;
}

/** 04 Demo & judging: a trophy. */
export function Trophy({ palette, hover }: P) {
  const ref = useSpin(hover, 0.45);
  const star = useRef<THREE.Mesh>(null);
  const cup = useMemo(() => {
    const pts = [
      [0.0, 0.0],
      [0.18, 0.0],
      [0.22, 0.05],
      [0.1, 0.12],
      [0.06, 0.35],
      [0.08, 0.42],
      [0.2, 0.48],
      [0.4, 0.62],
      [0.47, 0.85],
      [0.49, 1.08],
      [0.46, 1.1],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  useFrame(({ clock }) => {
    if (star.current) {
      star.current.rotation.z = clock.elapsedTime * 0.8;
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.12;
      star.current.scale.setScalar(s);
    }
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.25, 4.4]} fov={32} />
      <Lights palette={palette} />
      <Float speed={1.7} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={ref} position={[0, -0.62, 0]}>
          <mesh geometry={cup}>
            <meshPhysicalMaterial color="#ffc85a" emissive="#5a3a00" emissiveIntensity={0.6} metalness={0.55} roughness={0.22} clearcoat={1} side={THREE.DoubleSide} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.5, 0.84, 0]} rotation={[0, 0, s * 0.2]}>
              <torusGeometry args={[0.17, 0.035, 12, 32, Math.PI * 1.1]} />
              <meshPhysicalMaterial color="#ffc85a" emissive="#5a3a00" emissiveIntensity={0.6} metalness={0.55} roughness={0.22} />
            </mesh>
          ))}
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[0.62, 0.24, 0.62]} />
            <meshPhysicalMaterial color="#17193a" metalness={0.5} roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.12, 0.312]}>
            <planeGeometry args={[0.4, 0.05]} />
            <meshBasicMaterial color={palette.accent} toneMapped={false} />
          </mesh>
          <mesh ref={star} position={[0, 1.42, 0]}>
            <circleGeometry args={[0.12, 4]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Float>
    </>
  );
}
