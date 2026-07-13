import { CORRIDOR } from '../constants'
import type { RoomThemeSpec } from './types'
import { CorridorShell, PerspectiveRunway } from './CorridorShell'

function CarbonPanels({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const hw = w / 2 - 0.16
  const panels = 10
  const step = d / panels

  return (
    <group>
      {Array.from({ length: panels }, (_, i) => {
        const z = -d / 2 + step * (i + 0.5)
        return (
          <group key={i} position={[0, h / 2, z]}>
            {[-hw, hw].map((x) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                <planeGeometry args={[step * 0.88, h * 0.78]} />
                <meshStandardMaterial color={spec.wall} roughness={0.35} metalness={0.45} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function NeonGridLines({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const cyan = spec.accent
  const purple = spec.neonAccent ?? '#9b5cff'
  const lines = []

  for (let z = -d / 2 + 2; z < d / 2; z += 5.5) {
    lines.push(
      <mesh key={`h-${z}`} position={[0, h * 0.15, z]}>
        <boxGeometry args={[w * 0.86, 0.02, 0.02]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={1.1} />
      </mesh>
    )
  }

  for (let y = 0.4; y < h; y += 1.1) {
    lines.push(
      <mesh key={`v-${y}`} position={[0, y, 0]}>
        <boxGeometry args={[0.02, 0.02, d * 0.9]} />
        <meshStandardMaterial color={purple} emissive={purple} emissiveIntensity={0.9} />
      </mesh>
    )
  }

  return <group>{lines}</group>
}

function MirrorFloor({ spec }: { spec: RoomThemeSpec }) {
  const { w, d } = CORRIDOR
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
      <planeGeometry args={[w * 0.9, d * 0.94]} />
      <meshStandardMaterial
        color={spec.floor}
        roughness={0.04}
        metalness={0.88}
        emissive={spec.accent}
        emissiveIntensity={0.03}
      />
    </mesh>
  )
}

function HologramPedestals({ spec }: { spec: RoomThemeSpec }) {
  const positions = [-16, 16]
  const accent = spec.accent

  return (
    <group>
      {positions.map((z) => (
        <group key={z} position={[0, 0.35, z]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.42, 0.7, 6]} />
            <meshStandardMaterial color="#1a1a28" metalness={0.9} roughness={0.15} transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <torusGeometry args={[0.38, 0.02, 8, 24]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function ColdSpots({ spec }: { spec: RoomThemeSpec }) {
  const { d } = CORRIDOR
  const positions = Array.from({ length: 7 }, (_, i) => -d / 2 + 4 + i * 7.4)

  return (
    <group>
      {positions.flatMap((z) =>
        [-CORRIDOR.w / 2 + 0.35, CORRIDOR.w / 2 - 0.35].map((x) => (
          <spotLight
            key={`${x}-${z}`}
            position={[x, 2.8, z]}
            angle={0.35}
            penumbra={0.7}
            intensity={spec.spotIntensity}
            distance={9}
            color={spec.spotColor}
          />
        ))
      )}
    </group>
  )
}

export default function DigitalNftRoom({ spec }: { spec: RoomThemeSpec }) {
  return (
    <CorridorShell spec={spec}>
      <CarbonPanels spec={spec} />
      <NeonGridLines spec={spec} />
      <MirrorFloor spec={spec} />
      <PerspectiveRunway spec={spec} />
      <HologramPedestals spec={spec} />
      <ColdSpots spec={spec} />
    </CorridorShell>
  )
}
