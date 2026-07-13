import { CORRIDOR } from '../constants'
import type { RoomThemeSpec } from './types'
import { CorridorShell, PerspectiveRunway } from './CorridorShell'

function SkylightCeiling({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const panels = 6
  const step = d / panels

  return (
    <group position={[0, h - 0.02, 0]}>
      {Array.from({ length: panels }, (_, i) => {
        const z = -d / 2 + step * (i + 0.5)
        return (
          <group key={i} position={[0, 0, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w * 0.72, step * 0.82]} />
              <meshStandardMaterial
                color={spec.light}
                transparent
                opacity={0.55}
                roughness={0.1}
                metalness={0.05}
                emissive={spec.light}
                emissiveIntensity={0.22}
              />
            </mesh>
            <pointLight position={[0, -0.5, 0]} intensity={1.6} distance={12} color={spec.light} />
          </group>
        )
      })}
    </group>
  )
}

function TrackLighting({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  return (
    <group position={[0, h - 0.25, 0]}>
      <mesh>
        <boxGeometry args={[w * 0.85, 0.06, d * 0.9]} />
        <meshStandardMaterial color={spec.trim} roughness={0.35} metalness={0.5} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const z = -d / 2 + 3.5 + i * 7
        return (
          <group key={i} position={[0, -0.12, z]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.18, 12]} />
              <meshStandardMaterial color="#ccc" metalness={0.8} roughness={0.25} />
            </mesh>
            <spotLight position={[0, -0.2, 0]} angle={0.45} penumbra={0.9} intensity={spec.spotIntensity * 0.7} distance={10} color={spec.spotColor} />
          </group>
        )
      })}
    </group>
  )
}

function PlasterRelief({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const hw = w / 2 - 0.18

  return (
    <group>
      {[-hw, hw].map((x) => (
        <mesh key={x} position={[x, h * 0.5, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.92, h * 0.75]} />
          <meshStandardMaterial color={spec.wall} roughness={0.95} bumpScale={0.02} />
        </mesh>
      ))}
    </group>
  )
}

function CubePoufs({ spec }: { spec: RoomThemeSpec }) {
  const positions = [-14, 14]
  return (
    <group>
      {positions.map((z) => (
        <group key={z} position={[0, 0.22, z]}>
          <mesh>
            <boxGeometry args={[0.55, 0.44, 0.55]} />
            <meshStandardMaterial color={spec.wallAccent} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function WhiteCubeRoom({ spec }: { spec: RoomThemeSpec }) {
  return (
    <CorridorShell spec={spec}>
      <PlasterRelief spec={spec} />
      <PerspectiveRunway spec={spec} />
      <SkylightCeiling spec={spec} />
      <TrackLighting spec={spec} />
      <CubePoufs spec={spec} />
    </CorridorShell>
  )
}
