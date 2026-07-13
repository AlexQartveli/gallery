import type { ReactNode } from 'react'
import * as THREE from 'three'
import { CORRIDOR } from '../constants'
import type { RoomThemeSpec } from './types'

interface CorridorShellProps {
  spec: RoomThemeSpec
  children?: ReactNode
}

export function CorridorShell({ spec, children }: CorridorShellProps) {
  const { w, d, h } = CORRIDOR

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={spec.floor}
          roughness={spec.floorRoughness}
          metalness={spec.floorMetalness}
          envMapIntensity={spec.floorMetalness > 0.4 ? 1.2 : 0.4}
        />
      </mesh>

      {[
        [0, h / 2, -d / 2, w, h, 0.28],
        [0, h / 2, d / 2, w, h, 0.28],
        [-w / 2, h / 2, 0, 0.28, h, d],
        [w / 2, h / 2, 0, 0.28, h, d],
      ].map(([x, y, z, width, height, depth], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={spec.wall} roughness={0.88} metalness={0.04} />
        </mesh>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={spec.ceiling} side={THREE.DoubleSide} roughness={0.94} />
      </mesh>

      {children}
    </group>
  )
}

export function PerspectiveRunway({ spec }: { spec: RoomThemeSpec }) {
  const { w, d } = CORRIDOR
  const segments = 12

  return (
    <group>
      {Array.from({ length: segments }, (_, i) => {
        const t = i / (segments - 1)
        const z = -d / 2 + t * d
        const width = THREE.MathUtils.lerp(0.35, w * 0.55, t)
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z]}>
            <planeGeometry args={[width, 0.55]} />
            <meshStandardMaterial
              color={spec.trim}
              roughness={0.5}
              metalness={0.25}
              transparent
              opacity={0.18 + t * 0.12}
            />
          </mesh>
        )
      })}
    </group>
  )
}
