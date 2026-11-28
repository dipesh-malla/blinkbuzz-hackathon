import { View } from '@react-three/drei';
import Terrain from './Terrain';
import type { Palette } from '../../config/palettes';

/** The 3D landscape behind the registration panel. Loaded on demand so three.js stays out of the first download. */
export default function RegisterTerrain({ palette, lowPower }: { palette: Palette; lowPower: boolean }) {
  return (
    <View className="!pointer-events-none absolute inset-0">
      <Terrain palette={palette} lowPower={lowPower} />
    </View>
  );
}
