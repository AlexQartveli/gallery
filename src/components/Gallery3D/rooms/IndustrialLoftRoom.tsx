import { CORRIDOR } from '../constants'
import type { RoomThemeSpec } from './types'
import { CorridorShell, PerspectiveRunway } from './CorridorShell'

function ConcreteWalls({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const hw = w / 2 - 0.16

  return (
    <group>
      {[-hw, hw].map((x) => (
        <mesh key={x} position={[x, h / 2, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[d, h]} />
          <meshStandardMaterial color={spec.wall} roughness={0.92} metalness={0.02} />
        </mesh>
      ))}
    </group>
  )
}

function BrickAccents() {
  const { w, h } = CORRIDOR
  const hw = w / 2 - 0.14

  return (
    <group>
      {[-14, 0, 14].flatMap((z) =>
        [-hw, hw].map((x) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, h * 0.35, z]}
            rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[2.8, h * 0.45]} />
            <meshStandardMaterial color="#8b4513" roughness={0.98} />
          </mesh>
        ))
      )}
    </group>
  )
}

function ExposedPipes({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const pipeY = h - 0.55

  return (
    <group>
      <mesh position={[0, pipeY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, d * 0.92, 16]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.35} />
      </mesh>
      {[-w / 3, w / 3].map((x) => (
        <mesh key={x} position={[x, pipeY - 0.35, -d / 4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 3.5, 12]} />
          <meshStandardMaterial color="#444" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const z = -d / 2 + 4 + i * 7.4
        const hw = w / 2 - 0.35
        return (
          <group key={i}>
            {[-hw, hw].map((x) => (
              <group key={x} position={[x, h - 0.35, z]}>
                <mesh rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                  <boxGeometry args={[1.4, 0.05, 0.08]} />
                  <meshStandardMaterial color={spec.trim} metalness={0.85} roughness={0.2} />
                </mesh>
                <spotLight
                  position={[x < 0 ? 0.35 : -0.35, -0.15, 0]}
                  angle={0.32}
                  penumbra={0.4}
                  intensity={spec.spotIntensity}
                  distance={8}
                  color={spec.spotColor}
                />
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function NeonBaseboard({ spec }: { spec: RoomThemeSpec }) {
  const { w, d } = CORRIDOR
  const neon = spec.neonAccent ?? '#ff3366'

  return (
    <group>
      {[-w / 2 + 0.2, w / 2 - 0.2].map((x) => (
        <mesh key={x} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.04, 0.04, d * 0.88]} />
          <meshStandardMaterial color={neon} emissive={neon} emissiveIntensity={1.4} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function PolishedFloorOverlay({ spec }: { spec: RoomThemeSpec }) {
  const { w, d } = CORRIDOR
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <planeGeometry args={[w * 0.88, d * 0.92]} />
      <meshStandardMaterial
        color={spec.floor}
        roughness={0.08}
        metalness={0.62}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

export default function IndustrialLoftRoom({ spec }: { spec: RoomThemeSpec }) {
  return (
    <CorridorShell spec={spec}>
      <ConcreteWalls spec={spec} />
      <BrickAccents />
      <PolishedFloorOverlay spec={spec} />
      <PerspectiveRunway spec={spec} />
      <ExposedPipes spec={spec} />
      <NeonBaseboard spec={spec} />
    </CorridorShell>
  )
}
