import { CORRIDOR } from '../constants'
import type { RoomThemeSpec } from './types'
import { CorridorShell, PerspectiveRunway } from './CorridorShell'

function WallMoldings({ spec }: { spec: RoomThemeSpec }) {
  const { w, d, h } = CORRIDOR
  const hw = w / 2 - 0.2
  const bays = 8
  const step = d / bays

  return (
    <group>
      {Array.from({ length: bays }, (_, i) => {
        const z = -d / 2 + step * (i + 0.5)
        return (
          <group key={i} position={[0, h * 0.55, z]}>
            {[-hw, hw].map((x) => (
              <group key={x}>
                <mesh position={[x, 0, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                  <boxGeometry args={[step * 0.82, h * 0.42, 0.06]} />
                  <meshStandardMaterial color={spec.wallAccent} roughness={0.85} />
                </mesh>
                <mesh position={[x, -h * 0.18, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                  <boxGeometry args={[step * 0.82, 0.08, 0.04]} />
                  <meshStandardMaterial color={spec.trim} roughness={0.3} metalness={0.65} />
                </mesh>
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function HerringboneFloor({ spec }: { spec: RoomThemeSpec }) {
  const { w, d } = CORRIDOR
  const planks = []
  const plankW = 0.55
  const plankD = 0.18
  let row = 0

  for (let z = -d / 2 + 0.3; z < d / 2 - 0.3; z += plankD * 0.9) {
    const offset = row % 2 === 0 ? 0 : plankW * 0.5
    for (let x = -w / 2 + 0.4 + offset; x < w / 2 - 0.4; x += plankW) {
      planks.push(
        <mesh
          key={`${row}-${x}`}
          rotation={[-Math.PI / 2, row % 2 === 0 ? 0.65 : -0.65, 0]}
          position={[x, 0.008, z]}
        >
          <planeGeometry args={[plankW, plankD]} />
          <meshStandardMaterial
            color={row % 3 === 0 ? '#6b4a36' : spec.floor}
            roughness={0.22}
            metalness={0.18}
          />
        </mesh>
      )
    }
    row += 1
  }

  return <group>{planks}</group>
}

function Benches({ spec }: { spec: RoomThemeSpec }) {
  const seats = [-12, 0, 12]
  return (
    <group>
      {seats.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[1.8, 0.12, 0.55]} />
            <meshStandardMaterial color="#4a3020" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.42, -0.2]}>
            <boxGeometry args={[1.8, 0.35, 0.08]} />
            <meshStandardMaterial color="#3d2518" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.38, 0.12]}>
            <boxGeometry args={[1.65, 0.28, 0.32]} />
            <meshStandardMaterial color="#5c3028" roughness={0.75} />
          </mesh>
          {[-0.75, 0.75].map((x) => (
            <mesh key={x} position={[x, 0.12, 0]}>
              <boxGeometry args={[0.08, 0.24, 0.45]} />
              <meshStandardMaterial color={spec.trim} metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function BrassPictureLights({ spec }: { spec: RoomThemeSpec }) {
  const { d } = CORRIDOR
  const positions = Array.from({ length: 7 }, (_, i) => -d / 2 + 4 + i * 7.4)

  return (
    <group>
      {positions.flatMap((z) =>
        [-CORRIDOR.w / 2 + 0.35, CORRIDOR.w / 2 - 0.35].map((x) => (
          <group key={`${x}-${z}`} position={[x, 2.65, z]}>
            <mesh rotation={[Math.PI / 2.15, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2]}>
              <boxGeometry args={[0.38, 0.07, 0.14]} />
              <meshStandardMaterial color={spec.trim} metalness={0.85} roughness={0.2} emissive={spec.accent} emissiveIntensity={0.08} />
            </mesh>
            <spotLight
              position={[0, -0.15, 0.35]}
              angle={0.38}
              penumbra={0.85}
              intensity={spec.spotIntensity}
              distance={9}
              color={spec.spotColor}
            />
          </group>
        ))
      )}
    </group>
  )
}

export default function ClassicRealismRoom({ spec }: { spec: RoomThemeSpec }) {
  return (
    <CorridorShell spec={spec}>
      <HerringboneFloor spec={spec} />
      <PerspectiveRunway spec={spec} />
      <WallMoldings spec={spec} />
      <Benches spec={spec} />
      <BrassPictureLights spec={spec} />
      {[-CORRIDOR.d / 2 + 0.5, CORRIDOR.d / 2 - 0.5].map((z) => (
        <mesh key={z} position={[0, CORRIDOR.h / 2, z]}>
          <boxGeometry args={[CORRIDOR.w * 0.7, CORRIDOR.h * 0.85, 0.15]} />
          <meshStandardMaterial color={spec.wallAccent} roughness={0.9} />
        </mesh>
      ))}
    </CorridorShell>
  )
}
