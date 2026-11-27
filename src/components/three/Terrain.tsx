import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Palette } from '../../config/palettes';

// A slowly breathing point-cloud landscape with glowing contour lines,
// the backdrop behind the registration panel (Saltmere's pricing terrain).

const vert = /* glsl */ `
  uniform float uTime, uSize, uPixel;
  attribute float aSeed;
  varying float vH, vC, vEdge;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.02; a*=0.5; } return v; }
  void main(){
    vec3 p = position;
    vec2 q = p.xz * 0.32 + vec2(uTime * 0.025, -uTime * 0.018);
    float ridge = 1.0 - abs(fbm(q) * 2.0 - 1.0);
    float hgt = pow(ridge, 2.2) * 1.9 + fbm(q * 2.3) * 0.35;
    p.y += hgt;
    vH = clamp(hgt / 1.9, 0.0, 1.0);
    // contour bands
    float band = fract(hgt * 4.0);
    vC = 1.0 - smoothstep(0.0, 0.07, min(band, 1.0 - band));
    vEdge = 1.0 - smoothstep(4.5, 9.0, length(position.xz));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPixel * (0.6 + vC * 0.9 + aSeed * 0.3) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  uniform vec3 uA, uB, uC;
  varying float vH, vC, vEdge;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 col = mix(uB, uA, vH);
    col = mix(col, uC, smoothstep(0.75, 1.0, vH) * 0.6);
    col += vec3(1.0) * vC * 0.35;
    float a = (1.0 - smoothstep(0.0, 0.5, d)) * (0.16 + vH * 0.5 + vC * 0.45) * vEdge;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

export default function Terrain({ palette, lowPower }: { palette: Palette; lowPower: boolean }) {
  const { camera } = useThree();
  const geo = useMemo(() => {
    const nx = lowPower ? 110 : 190;
    const nz = lowPower ? 70 : 120;
    const pos = new Float32Array(nx * nz * 3);
    const seed = new Float32Array(nx * nz);
    let k = 0;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        pos[k * 3] = (i / (nx - 1) - 0.5) * 16;
        pos[k * 3 + 1] = 0;
        pos[k * 3 + 2] = (j / (nz - 1) - 0.5) * 10;
        seed[k] = Math.random();
        k++;
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [lowPower]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: lowPower ? 16 : 19 },
          uPixel: { value: Math.min(window.devicePixelRatio, 2) },
          uA: { value: new THREE.Color(palette.accent) },
          uB: { value: new THREE.Color(palette.accent2) },
          uC: { value: new THREE.Color(palette.hot) },
        },
      }),
    [palette, lowPower],
  );
  useEffect(() => {
    camera.lookAt(0, 0.2, 0);
  }, [camera]);
  useFrame(({ clock, pointer }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
    camera.lookAt(0, 0.2, 0);
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.6, 6.2]} fov={42} />
      <points geometry={geo} material={mat} frustumCulled={false} />
    </>
  );
}
