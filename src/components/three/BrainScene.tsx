import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import type { Palette } from '../../config/palettes';
import { buildBrain, REGION_ANCHORS } from './brainGeometry';

// ─────────────────────────────────────────────────────────────
//  Hero scene: a brain of neurons on a holographic projector.
//  Each track (AI, FinTech, …) owns a region. The active region
//  lights up in its colour and fires pulses along its synapses.
// ─────────────────────────────────────────────────────────────

export type BrainTrack = { name: string; color: string };

type Props = {
  palette: Palette;
  tracks: BrainTrack[];
  active: number;
  onActive: (i: number) => void;
  onHold: (holding: boolean) => void; // pause auto-cycling while the visitor interacts
  running: boolean;
  start: boolean; // play the assemble intro
  lowPower: boolean;
};

const MAX = 6;
const col = (hex: string) => new THREE.Color(hex);

// ── Neurons ───────────────────────────────────────────────────
const neuronVert = /* glsl */ `
  uniform float uTime, uReveal, uSize, uPixel, uMouseOn;
  uniform float uLevels[${MAX}];
  uniform vec3 uColors[${MAX}];
  uniform vec3 uBaseA, uBaseB, uMouse;
  attribute float aRegion, aWeight, aDist, aSeed, aTone, aShell;
  varying vec3 vColor;
  varying float vAlpha, vCore;
  void main() {
    int r = int(aRegion + 0.5);
    float lvl = uLevels[r] * aWeight;
    // intro: neurons fly in from a loose shell and settle into the brain
    float t = clamp((uReveal * 1.6) - aSeed * 0.6, 0.0, 1.0);
    t = 1.0 - pow(1.0 - t, 3.0);
    vec3 scatter = normalize(position + vec3(0.001)) * (3.2 + aSeed * 3.0) + vec3(0.0, aSeed - 0.5, 0.0) * 2.0;
    vec3 p = mix(scatter, position, t);
    // a ring of light sweeps out from the active region's anchor
    float rd = (aDist - mod(uTime * 0.9 + aSeed * 0.05, 1.8)) * 7.0;
    float ring = exp(-rd * rd) * lvl;
    // the cursor wakes nearby neurons
    float md = distance(position, uMouse);
    float near = uMouseOn * exp(-md * md * 9.0);
    float tw = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 40.0);
    vec3 base = mix(uBaseB, uBaseA, aTone);
    vColor = mix(base * (0.42 + 0.25 * aShell), uColors[r], clamp(lvl * 1.1, 0.0, 1.0));
    vColor += mix(vec3(1.0), uColors[r], 0.5) * ring * 0.45 + vec3(1.0) * near * 0.4;
    vColor += uBaseA * near * 0.6;
    vAlpha = (0.32 + 0.5 * tw) * mix(0.45, 1.0, aShell) * t;
    vAlpha = min(1.0, vAlpha * (1.0 - lvl * 0.25) + lvl * 0.12 + ring * 0.5 + near * 0.45);
    vCore = lvl + ring + near;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = uSize * (0.55 + aSeed * 0.9) * (1.0 + lvl * 0.45 + ring * 1.2 + near * 1.2) * mix(0.7, 1.0, aShell);
    gl_PointSize = size * uPixel * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const neuronFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vCore;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = (1.0 - smoothstep(0.0, 0.5, d));
    float core = (1.0 - smoothstep(0.0, 0.16, d));
    vec3 c = vColor * soft + mix(vColor, vec3(1.0), 0.6) * core * (0.3 + vCore * 0.35);
    gl_FragColor = vec4(c, soft * vAlpha);
    #include <colorspace_fragment>
  }
`;

// ── Synapses ──────────────────────────────────────────────────
const lineVert = /* glsl */ `
  uniform float uLevels[${MAX}];
  uniform vec3 uColors[${MAX}];
  uniform float uReveal;
  attribute float aT, aRegion, aWeight, aSeed;
  varying float vT, vLvl, vSeed, vReveal;
  varying vec3 vCol;
  void main() {
    int r = int(aRegion + 0.5);
    vLvl = uLevels[r] * aWeight;
    vCol = uColors[r];
    vT = aT;
    vSeed = aSeed;
    vReveal = clamp(uReveal * 1.4 - 0.4, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const lineFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseA;
  varying float vT, vLvl, vSeed, vReveal;
  varying vec3 vCol;
  void main() {
    // a spark travelling along the synapse
    float speed = 0.35 + vSeed * 0.9;
    float head = fract(uTime * speed + vSeed * 7.0);
    float sd = (vT - head) * 9.0;
    float spark = exp(-sd * sd);
    float ambient = step(0.86, vSeed) * spark * 0.55;          // a few fire everywhere
    float fire = spark * vLvl * 1.4;                            // the active region fires a lot
    vec3 c = mix(uBaseA * 0.55, vCol, clamp(vLvl * 1.2, 0.0, 1.0));
    float a = (0.07 + vLvl * 0.22 + ambient + fire) * vReveal;
    gl_FragColor = vec4(c * (1.0 + fire * 1.6 + ambient), clamp(a, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

// ── Nebula + light shafts (full-screen, behind everything) ────
const skyVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;
const skyFrag = /* glsl */ `
  uniform float uTime, uAspect;
  uniform vec3 uBg, uBg2, uA, uB, uC;
  varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  // 3 octaves: the nebula is soft and slow, more detail only cost frames on large screens
  float fbm(vec2 p){ float v=0.0, a=0.57; for(int i=0;i<3;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
  void main() {
    vec2 uv = vUv; vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.02;
    float c1 = fbm(p * 1.6 + vec2(t, -t * 0.6));
    float c2 = fbm(p * 3.1 - vec2(t * 0.7, t));
    vec3 col = mix(uBg, uBg2, smoothstep(0.15, 0.95, uv.y * 0.6 + c1 * 0.7));
    col += uB * pow(c1, 3.0) * 0.55;                                // violet clouds
    col += uA * pow(c2, 4.0) * 0.22 * smoothstep(0.2, 1.0, uv.x);   // cyan haze
    col += uC * pow(c2 * 0.55 + c1 * 0.45, 5.0) * 0.28 * (1.0 - uv.y); // low glow (reuses the two cloud layers)
    // light shafts falling from the top
    vec2 s = vec2(0.62 * uAspect, 1.25);
    vec2 d = p - s;
    float ang = atan(d.x, -d.y);
    float shafts = pow(0.5 + 0.5 * sin(ang * 26.0 + c1 * 5.0), 6.0) + pow(0.5 + 0.5 * sin(ang * 11.0 - 1.3), 9.0);
    float fall = (1.0 - smoothstep(0.1, 1.9, length(d))) * (1.0 - smoothstep(0.0, 0.65, abs(ang)));
    col += mix(uA, uB, 0.5) * shafts * fall * 0.11;
    // vignette
    col *= 1.0 - 0.55 * pow(max(length(uv - vec2(0.55, 0.5)) * 1.15, 0.0), 2.2);
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <colorspace_fragment>
  }
`;

// ── Projector light cone ──────────────────────────────────────
const coneVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const coneFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uTime, uStrength;
  varying vec2 vUv;
  void main(){
    float streaks = 0.55 + 0.45 * sin(vUv.x * 120.0 + uTime * 0.8) * sin(vUv.x * 37.0 - uTime * 0.5);
    float fade = pow(1.0 - vUv.y, 2.2);
    gl_FragColor = vec4(uColor * 1.1, fade * streaks * 0.15 * uStrength);
    #include <colorspace_fragment>
  }
`;

function Sky({ palette }: { palette: Palette }) {
  const { size } = useThree();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uBg: { value: col(palette.bg) },
          uBg2: { value: col(palette.bg2) },
          uA: { value: col(palette.accent) },
          uB: { value: col(palette.accent2) },
          uC: { value: col(palette.hot) },
        },
      }),
    [palette],
  );
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uAspect.value = size.width / size.height;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function Stars({ count, color }: { count: number; color: string }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * 20;
      const s = Math.sqrt(1 - u * u);
      p[i * 3] = s * Math.cos(a) * r;
      p[i * 3 + 1] = u * r * 0.7;
      p[i * 3 + 2] = -Math.abs(s * Math.sin(a) * r) - 4;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  return (
    <points geometry={geo}>
      <pointsMaterial color={color} size={0.06} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

/** Drifting dust in front of and around the brain (Saltmere's mist motes). */
function Dust({ count, color }: { count: number; color: string }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 12;
      p[i * 3 + 1] = (Math.random() - 0.5) * 7;
      p[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.01;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.15) * 0.15;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={0.022} sizeAttenuation transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function ringPts(r: number, seg = 128) {
  const a = new Float32Array((seg + 1) * 3);
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    a[i * 3] = Math.cos(t) * r;
    a[i * 3 + 2] = Math.sin(t) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}

/** Holographic projector the brain floats above. */
function Projector({ color, accent }: { color: THREE.Color; accent: string }) {
  const rings = useRef<THREE.Group>(null);
  const cone = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coneVert,
        fragmentShader: coneFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: color.clone() }, uTime: { value: 0 }, uStrength: { value: 1 } },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const lines = useMemo(() => [1.25, 1.55, 1.9, 2.3].map((r) => ringPts(r)), []);
  useFrame(({ clock }) => {
    cone.uniforms.uTime.value = clock.elapsedTime;
    (cone.uniforms.uColor.value as THREE.Color).lerp(color, 0.06);
    if (rings.current) rings.current.children.forEach((c, i) => (c.rotation.y = clock.elapsedTime * (i % 2 ? -0.08 : 0.12) * (1 + i * 0.3)));
  });
  return (
    <group position={[0, -1.72, 0]}>
      {/* glowing disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.45, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.38, 1.46, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <group ref={rings}>
        {lines.map((g, i) => (
          <lineLoop key={i} geometry={g} ref={(l) => l?.computeLineDistances()}>
            <lineDashedMaterial color={accent} transparent opacity={0.35 - i * 0.06} dashSize={0.08 + i * 0.04} gapSize={0.06 + i * 0.05} depthWrite={false} />
          </lineLoop>
        ))}
      </group>
      {/* light rising into the brain */}
      <mesh position={[0, 0.95, 0]} material={cone}>
        <cylinderGeometry args={[1.75, 1.42, 1.9, 96, 1, true]} />
      </mesh>
    </group>
  );
}

type Rig = { yaw: number; pitch: number; dragYaw: number; dragPitch: number; holdUntil: number };

function Brain({ palette, tracks, active, onActive, onHold, start, lowPower, labels }: Props & { labels: React.MutableRefObject<(HTMLButtonElement | null)[]> }) {
  const n = Math.min(MAX, Math.max(1, tracks.length));
  const data = useMemo(() => buildBrain(lowPower ? 2800 : 6200, n, lowPower ? 900 : 2000), [n, lowPower]);
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const { camera, gl, size, pointer, raycaster } = useThree();
  const rig = useRef<Rig>({ yaw: 0.5, pitch: 0, dragYaw: 0, dragPitch: 0, holdUntil: 0 });
  const reveal = useRef(0);
  const projColor = useMemo(() => new THREE.Color(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const centre = useMemo(() => new THREE.Vector3(), []);
  const v1 = useMemo(() => new THREE.Vector3(), []);
  const v2 = useMemo(() => new THREE.Vector3(), []);
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), 1.7), []);

  const colors = useMemo(() => {
    const arr = Array.from({ length: MAX }, (_, i) => col(tracks[i]?.color ?? palette.accent));
    return arr;
  }, [tracks, palette.accent]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: lowPower ? 48 : 56 },
      uPixel: { value: Math.min(window.devicePixelRatio, 2) },
      uLevels: { value: new Array(MAX).fill(0) },
      uColors: { value: colors },
      uBaseA: { value: col(palette.accent) },
      uBaseB: { value: col(palette.accent2) },
      uMouse: { value: new THREE.Vector3(99, 99, 99) },
      uMouseOn: { value: 0 },
    }),
    // colours update in place below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lowPower],
  );
  useEffect(() => {
    uniforms.uColors.value = colors;
    (uniforms.uBaseA.value as THREE.Color).set(palette.accent);
    (uniforms.uBaseB.value as THREE.Color).set(palette.accent2);
  }, [colors, palette, uniforms]);

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1));
    g.setAttribute('aWeight', new THREE.BufferAttribute(data.weight, 1));
    g.setAttribute('aDist', new THREE.BufferAttribute(data.dist, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(data.seed, 1));
    g.setAttribute('aTone', new THREE.BufferAttribute(data.tone, 1));
    g.setAttribute('aShell', new THREE.BufferAttribute(data.shell, 1));
    return g;
  }, [data]);
  const linesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(data.lines, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(data.lineT, 1));
    g.setAttribute('aRegion', new THREE.BufferAttribute(data.lineRegion, 1));
    g.setAttribute('aWeight', new THREE.BufferAttribute(data.lineWeight, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(data.lineSeed, 1));
    return g;
  }, [data]);

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: neuronVert,
        fragmentShader: neuronFrag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );
  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  // drag to turn the brain (horizontal drags only on touch, so the page still scrolls)
  useEffect(() => {
    const el = gl.domElement.parentElement?.parentElement ?? gl.domElement;
    let down = false;
    let lx = 0;
    let ly = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      onHold(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      rig.current.dragYaw += (e.clientX - lx) * 0.006;
      if (e.pointerType !== 'touch') rig.current.dragPitch = THREE.MathUtils.clamp(rig.current.dragPitch + (e.clientY - ly) * 0.004, -0.5, 0.5);
      lx = e.clientX;
      ly = e.clientY;
      rig.current.holdUntil = performance.now() + 3500;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      onHold(false);
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, onHold]);

  // Fit the brain into the free space beside the words (and the glass cards on wide screens).
  const wide = size.width / size.height;
  const stacked = wide < 1; // portrait phone or tablet: brain on top, words below
  const halfW = Math.tan((34 / 2) * (Math.PI / 180)) * 7.4 * wide; // half the visible width at the brain
  const px = (2 * halfW) / size.width; // world units per pixel
  let offset: [number, number, number] = [0, 1.0, 0];
  let scale = Math.min(0.66, wide * 1.2);
  if (!stacked) {
    const edge = Math.min(64, Math.max(20, size.width * 0.044));
    const wrapL = Math.max(0, (size.width - 1440) / 2); // content is capped at 1440px and centred
    const textEnd = wrapL + edge + Math.min(640, size.width * 0.54);
    const right = size.width >= 1280 ? size.width - wrapL - edge - 248 - 20 : size.width - wrapL - edge;
    const gap = Math.max(220, right - textEnd);
    const center = (textEnd + right) / 2;
    scale = Math.min(1.0, Math.max(0.55, (gap * 1.15 * px) / (size.width >= 1280 ? 3.0 : 3.6)), (4.52 * 0.8) / 3.3);
    offset = [(center - size.width / 2) * px, 0.08, 0];
  }

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    if (start) reveal.current = Math.min(1, reveal.current + dt / 2.6);
    uniforms.uReveal.value = reveal.current;

    // crossfade the region levels
    const lv = uniforms.uLevels.value as number[];
    for (let i = 0; i < MAX; i++) lv[i] += ((i === active ? 1 : 0) - lv[i]) * Math.min(1, dt * 3.2);
    projColor.copy(colors[active] ?? colors[0]);

    // turn the active region towards the camera, with a slow sway
    const a = REGION_ANCHORS[active]?.p ?? [0, 0, 1];
    // never show the brain straight from behind: clamp to a three-quarter view
    const targetYaw = THREE.MathUtils.clamp(-Math.atan2(a[0], a[2]), -1.75, 1.75) + 0.42 + Math.sin(t * 0.18) * 0.22;
    const r = rig.current;
    if (performance.now() > r.holdUntil) {
      r.dragYaw *= 1 - Math.min(1, dt * 0.8);
      r.dragPitch *= 1 - Math.min(1, dt * 0.8);
    }
    let dy = targetYaw - r.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    r.yaw += dy * Math.min(1, dt * 1.4);
    const targetPitch = -a[1] * 0.18 + pointer.y * -0.08;
    r.pitch += (targetPitch - r.pitch) * Math.min(1, dt * 1.5);
    if (spin.current) {
      spin.current.rotation.y = r.yaw + r.dragYaw + pointer.x * 0.12;
      spin.current.rotation.x = r.pitch + r.dragPitch;
      spin.current.position.y = Math.sin(t * 0.6) * 0.05;
    }

    // cursor position in the brain's own space, so nearby neurons react
    if (!stacked && spin.current && group.current) {
      raycaster.setFromCamera(pointer, camera);
      spin.current.getWorldPosition(sphere.center);
      sphere.radius = 1.7 * scale;
      const hit = raycaster.ray.intersectSphere(sphere, tmp);
      if (hit) {
        spin.current.worldToLocal(tmp);
        (uniforms.uMouse.value as THREE.Vector3).lerp(tmp, 0.25);
        uniforms.uMouseOn.value += (1 - uniforms.uMouseOn.value) * 0.1;
      } else uniforms.uMouseOn.value *= 0.9;
    }

    // hotspot labels: project each anchor to the screen
    labels.current.forEach((el, i) => {
      if (!el || !spin.current) return;
      const p = data.anchors[i];
      if (!p) return;
      tmp.set(p[0], p[1] + 0.12, p[2]);
      spin.current.localToWorld(tmp);
      // facing the camera?
      // (vectors reused every frame: no garbage, no GC stutter)
      spin.current.getWorldPosition(centre);
      const facing = v1.copy(tmp).sub(centre).normalize().dot(v2.copy(camera.position).sub(tmp).normalize());
      tmp.project(camera);
      const x = ((tmp.x + 1) / 2) * size.width;
      const y = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      const vis = reveal.current > 0.85 ? THREE.MathUtils.clamp((facing + 0.25) * 2.2, 0.18, 1) : 0;
      el.style.opacity = String(i === active ? Math.max(vis, 0.95 * (reveal.current > 0.85 ? 1 : 0)) : vis);
      el.style.zIndex = facing > 0 ? '3' : '1';
    });
  });

  return (
    <group ref={group} position={offset} scale={scale}>
      <group ref={spin}>
        <points geometry={pointsGeo} material={pointsMat} frustumCulled={false} />
        <lineSegments geometry={linesGeo} material={linesMat} frustumCulled={false} />
        {/* invisible hit targets on each region */}
        {data.anchors.map((p, i) => (
          <mesh
            key={i}
            position={p}
            onPointerOver={(e) => {
              e.stopPropagation();
              onActive(i);
              onHold(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              onHold(false);
              document.body.style.cursor = '';
            }}
          >
            <sphereGeometry args={[0.42, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <Projector color={projColor} accent={palette.accent} />
    </group>
  );
}

export default function BrainScene(props: Props) {
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const { tracks, active, onActive, running, lowPower, palette } = props;
  const shown = tracks.slice(0, MAX);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.5));
  return (
    <>
      <Canvas
        frameloop={running ? 'always' : 'never'}
        dpr={dpr}
        camera={{ position: [0, 0.3, 7.4], fov: 34 }}
        gl={{ antialias: !lowPower, alpha: false, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
        onCreated={({ gl }) => gl.setClearColor(palette.bg)}
      >
        {/* drop the resolution if the device can't keep up */}
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(lowPower ? 1.25 : 1.5)} flipflops={3} />
        <Sky palette={palette} />
        <Stars count={lowPower ? 500 : 1400} color={palette.ink} />
        <Dust count={lowPower ? 160 : 420} color={palette.accent} />
        <Brain {...props} labels={labels} />
      </Canvas>
      {/* hotspot labels, placed every frame from 3D */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block" aria-hidden>
        {shown.map((t, i) => (
          <button
            key={t.name + i}
            tabIndex={-1}
            ref={(el) => {
              labels.current[i] = el;
            }}
            onClick={() => onActive(i)}
            onMouseEnter={() => onActive(i)}
            className="pointer-events-auto absolute left-0 top-0 flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-[background-color,border-color,color] duration-300"
            style={{
              opacity: 0,
              borderColor: i === active ? t.color : 'rgba(255,255,255,0.16)',
              background: i === active ? `color-mix(in oklab, ${t.color} 24%, color-mix(in oklab, var(--bg) 88%, transparent))` : 'color-mix(in oklab, var(--bg) 82%, transparent)',
              color: i === active ? '#fff' : 'rgba(238,241,255,0.8)',
              willChange: 'transform, opacity',
            }}
          >
            <span className="relative flex h-2 w-2">
              {i === active && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: t.color }} />}
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }} />
            </span>
            {t.name}
          </button>
        ))}
      </div>
    </>
  );
}
