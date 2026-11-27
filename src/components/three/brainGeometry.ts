// Procedural brain made of neurons. Built from maths, no model files,
// so there is nothing to license and nothing heavy to download.
//
// Axes: x = left/right, y = up, z = front (+) / back (−).

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Folds of the cortex: a cheap 3D "gyri" field. */
function gyri(x: number, y: number, z: number) {
  return (
    Math.sin(4.2 * x + 1.3) * Math.sin(3.6 * y + 2.1) * Math.sin(4.6 * z + 0.4) +
    0.55 * Math.sin(9.1 * x + 0.7) * Math.sin(8.3 * y + 1.9) * Math.sin(9.7 * z + 2.6) +
    0.25 * Math.sin(17.0 * x) * Math.sin(15.0 * y + 0.5) * Math.sin(18.0 * z + 1.1)
  );
}

/** Region anchors on the surface, in track order. `sym` = mirrored on both hemispheres. */
export const REGION_ANCHORS: { p: [number, number, number]; sym: boolean }[] = [
  { p: [0.0, 0.78, 1.05], sym: false }, // frontal lobe        → track 1
  { p: [0.0, 1.02, -0.38], sym: false }, // parietal crown     → track 2
  { p: [1.22, -0.28, 0.32], sym: true }, // temporal lobes     → track 3
  { p: [0.0, -0.55, -1.42], sym: false }, // occipital + cerebellum → track 4
  { p: [1.26, 0.42, -0.55], sym: true }, // side, upper-back    → track 5
  { p: [0.0, -0.95, 0.2], sym: false }, // base / brainstem      → track 6
];

export type BrainData = {
  positions: Float32Array;
  region: Float32Array; // region index (0..n-1)
  weight: Float32Array; // 1 at the anchor, fading out
  dist: Float32Array; // distance to its anchor (for the pulse ring)
  seed: Float32Array;
  tone: Float32Array; // 0 violet … 1 cyan
  shell: Float32Array; // 1 surface neuron, 0 deep neuron
  lines: Float32Array; // synapse segment endpoints
  lineT: Float32Array; // 0 at start, 1 at end (pulse travel)
  lineRegion: Float32Array;
  lineWeight: Float32Array;
  lineSeed: Float32Array;
  anchors: [number, number, number][]; // hotspot positions (right hemisphere for mirrored ones)
};

export function buildBrain(count: number, regions: number, lineNodes: number): BrainData {
  const r = rng(20261127);
  const pts: number[] = [];
  const shell: number[] = [];

  const cerebrum = (tx: number, ty: number, tz: number) => {
    // direction → ellipsoid with folds
    const len = Math.hypot(tx, ty, tz) || 1;
    let x = (tx / len) * 1.28;
    let y = (ty / len) * 1.0;
    let z = (tz / len) * 1.62;
    if (y < 0) y *= 0.72; // flatter underside
    x *= 1 - 0.14 * Math.max(0, z / 1.62); // narrower forehead
    if (y < 0.1 && Math.abs(z) < 0.9) x *= 1.06; // temporal bulge
    const f = 1 + 0.05 * gyri(x, y, z);
    x *= f;
    y *= f;
    z *= f;
    // longitudinal fissure: split the hemispheres
    const s = x >= 0 ? 1 : -1;
    x += s * 0.07;
    if (Math.abs(x) < 0.16 && y > 0.25) y -= 0.08 * (1 - Math.abs(x) / 0.16);
    return [x, y + 0.12, z] as const;
  };

  const cerebrumCount = Math.floor(count * 0.84);
  for (let i = 0; i < cerebrumCount; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const sq = Math.sqrt(1 - u * u);
    const [x, y, z] = cerebrum(sq * Math.cos(th), u, sq * Math.sin(th));
    const onShell = r() < 0.78;
    const k = onShell ? 1 - r() * 0.035 : 0.25 + Math.cbrt(r()) * 0.68;
    pts.push(x * k, (y - 0.12) * k + 0.12, z * k);
    shell.push(onShell ? 1 : 0);
  }
  // cerebellum: finely striped, tucked under the back
  const cbCount = Math.floor(count * 0.12);
  for (let i = 0; i < cbCount; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const sq = Math.sqrt(1 - u * u);
    let x = sq * Math.cos(th) * 0.86;
    let y = u * 0.42;
    let z = sq * Math.sin(th) * 0.56;
    const f = 1 + 0.045 * Math.sin(y * 38);
    x *= f;
    y *= f;
    z *= f;
    pts.push(x, y - 0.74, z - 1.08);
    shell.push(1);
  }
  // brainstem
  const bsCount = count - cerebrumCount - cbCount;
  for (let i = 0; i < bsCount; i++) {
    const t = r();
    const a = r() * Math.PI * 2;
    const rad = 0.2 * (1 - t * 0.25) * Math.sqrt(r());
    pts.push(Math.cos(a) * rad, -0.55 - t * 0.85, -0.42 - t * 0.28 + Math.sin(a) * rad);
    shell.push(0.6);
  }

  const n = pts.length / 3;
  const positions = new Float32Array(pts);
  const region = new Float32Array(n);
  const weight = new Float32Array(n);
  const dist = new Float32Array(n);
  const seed = new Float32Array(n);
  const tone = new Float32Array(n);
  const shellA = new Float32Array(shell);
  const anchors = REGION_ANCHORS.slice(0, Math.max(1, regions));

  for (let i = 0; i < n; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    let best = 0;
    let bd = Infinity;
    anchors.forEach((a, j) => {
      const ax = a.sym ? Math.abs(x) : x;
      const d = Math.hypot(ax - a.p[0], y - a.p[1], z - a.p[2]);
      if (d < bd) {
        bd = d;
        best = j;
      }
    });
    region[i] = best;
    dist[i] = bd;
    weight[i] = Math.max(0, 1 - Math.pow(bd / 1.15, 1.6));
    seed[i] = r();
    tone[i] = shellA[i] > 0.9 ? 0.45 + r() * 0.55 : r() * 0.6;
  }

  // synapses: link each chosen neuron to its nearest neighbours (grid hash)
  const cell = 0.34;
  const grid = new Map<string, number[]>();
  const nodes: number[] = [];
  for (let i = 0; i < n && nodes.length < lineNodes; i++) {
    if (shellA[i] < 0.9 && r() > 0.25) continue;
    if (r() > lineNodes / (n * 0.8)) continue;
    nodes.push(i);
  }
  const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  nodes.forEach((i) => {
    const k = key(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    const list = grid.get(k);
    if (list) list.push(i);
    else grid.set(k, [i]);
  });
  const segs: number[] = [];
  const segT: number[] = [];
  const segR: number[] = [];
  const segW: number[] = [];
  const segS: number[] = [];
  const seen = new Set<string>();
  nodes.forEach((i) => {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const cz = Math.floor(z / cell);
    const near: [number, number][] = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!list) continue;
          for (const j of list) {
            if (j === i) continue;
            const d = Math.hypot(positions[j * 3] - x, positions[j * 3 + 1] - y, positions[j * 3 + 2] - z);
            if (d < cell && d > 0.04) near.push([d, j]);
          }
        }
    near.sort((a, b) => a[0] - b[0]);
    near.slice(0, 3).forEach(([, j]) => {
      const id = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(id)) return;
      seen.add(id);
      segs.push(x, y, z, positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
      segT.push(0, 1);
      const s = r();
      segR.push(region[i], region[i]);
      segW.push(weight[i], weight[j]);
      segS.push(s, s);
    });
  });

  return {
    positions,
    region,
    weight,
    dist,
    seed,
    tone,
    shell: shellA,
    lines: new Float32Array(segs),
    lineT: new Float32Array(segT),
    lineRegion: new Float32Array(segR),
    lineWeight: new Float32Array(segW),
    lineSeed: new Float32Array(segS),
    anchors: anchors.map((a) => a.p),
  };
}
