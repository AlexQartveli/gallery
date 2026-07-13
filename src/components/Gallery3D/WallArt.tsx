import { useMemo } from 'react'
import * as THREE from 'three'
import { useArtworkTexture, getWatermarkOverlayTexture } from '../../lib/artworkTexture'
import { isBoostActive } from '../../data/boosts'
import type { Artwork } from '../../types'
import type { FrameStyle, RoomThemeSpec } from './rooms/types'

interface WallArtProps {
  artwork: Artwork
  position: [number, number, number]
  rotation: [number, number, number]
  spec: RoomThemeSpec
  selected: boolean
}

function FrameOrnate({ w, h, selected, spec, hasCrown }: { w: number; h: number; selected: boolean; spec: RoomThemeSpec; hasCrown: boolean }) {
  const frameColor = hasCrown ? '#d4af37' : '#6f5842'
  return (
    <>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.28, h + 0.28, 0.1]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.32}
          metalness={hasCrown ? 0.6 : 0.28}
          emissive={selected ? spec.accent : '#000000'}
          emissiveIntensity={selected ? 0.15 : 0}
        />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.02]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.95} />
      </mesh>
    </>
  )
}

function FrameMinimal({ w, h, selected, spec }: { w: number; h: number; selected: boolean; spec: RoomThemeSpec }) {
  return (
  <>
    <mesh position={[0, 0, -0.025]}>
      <boxGeometry args={[w + 0.04, h + 0.04, 0.015]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.4}
        emissive={selected ? spec.accent : '#000000'}
        emissiveIntensity={selected ? 0.08 : 0}
      />
    </mesh>
    <mesh position={[0, 0, -0.012]}>
      <boxGeometry args={[w + 0.12, h + 0.12, 0.008]} />
      <meshStandardMaterial color="#fafafa" roughness={0.98} />
    </mesh>
  </>
  )
}

function FrameHanging({ w, h, selected, spec }: { w: number; h: number; selected: boolean; spec: RoomThemeSpec }) {
  return (
    <>
      <mesh position={[0, h / 2 + 0.55, -0.04]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-w * 0.35, w * 0.35].map((x) => (
        <mesh key={x} position={[x, h / 2 + 0.35, -0.04]}>
          <cylinderGeometry args={[0.008, 0.008, 0.35, 6]} />
          <meshStandardMaterial color="#222" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.03]} />
        <meshStandardMaterial color={spec.trim} metalness={0.75} roughness={0.25} emissive={selected ? spec.accent : '#000'} emissiveIntensity={selected ? 0.2 : 0} />
      </mesh>
    </>
  )
}

function FrameHolographic({ w, h, selected, spec }: { w: number; h: number; selected: boolean; spec: RoomThemeSpec }) {
  const glow = selected ? spec.accent : spec.neonAccent ?? spec.accent
  return (
    <>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.04]} />
        <meshStandardMaterial color="#0a0a14" emissive={glow} emissiveIntensity={selected ? 0.85 : 0.45} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[w + 0.2, h + 0.2, 0.02]} />
        <meshStandardMaterial color={glow} transparent opacity={0.25} emissive={glow} emissiveIntensity={0.6} />
      </mesh>
    </>
  )
}

function ArtFrame({ style, w, h, selected, spec, hasCrown }: { style: FrameStyle; w: number; h: number; selected: boolean; spec: RoomThemeSpec; hasCrown: boolean }) {
  switch (style) {
    case 'minimal':
      return <FrameMinimal w={w} h={h} selected={selected} spec={spec} />
    case 'hanging':
      return <FrameHanging w={w} h={h} selected={selected} spec={spec} />
    case 'holographic':
      return <FrameHolographic w={w} h={h} selected={selected} spec={spec} />
    case 'industrial':
      return <FrameHanging w={w} h={h} selected={selected} spec={spec} />
    case 'ornate':
    default:
      return <FrameOrnate w={w} h={h} selected={selected} spec={spec} hasCrown={hasCrown} />
  }
}

export default function WallArt({ artwork, position, rotation, spec, selected }: WallArtProps) {
  const { texture, failed, fallbackColor } = useArtworkTexture(artwork.imageUrl, artwork.id)
  const watermark = useMemo(() => getWatermarkOverlayTexture(), [])

  const canvasMaterial = useMemo(() => {
    if (texture) {
      return new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    }
    return new THREE.MeshBasicMaterial({
      color: fallbackColor,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: failed,
      opacity: failed ? 0.92 : 1,
    })
  }, [texture, fallbackColor, failed])

  const aspect = artwork.width / artwork.height
  const h = 1.55
  const w = Math.min(h * aspect, 2.3)
  const hasCrown = isBoostActive(artwork.vipBoosts?.crown)
  const hasSpotlight = isBoostActive(artwork.vipBoosts?.spotlight)
  const floatZ = spec.frameStyle === 'holographic' ? 0.04 : spec.frameStyle === 'hanging' ? 0.02 : 0.015

  return (
    <group position={position} rotation={rotation}>
      <spotLight
        position={[0, 1.2, 0.65]}
        angle={0.4}
        penumbra={0.82}
        intensity={hasSpotlight ? spec.spotIntensity * 1.2 : spec.spotIntensity * 0.75}
        distance={7.5}
        color={spec.spotColor}
      />

      <ArtFrame style={spec.frameStyle} w={w} h={h} selected={selected} spec={spec} hasCrown={hasCrown} />

      <mesh position={[0, 0, floatZ]} userData={{ artwork }} material={canvasMaterial}>
        <planeGeometry args={[w, h]} />
      </mesh>

      {texture && (
        <mesh position={[0, 0, floatZ + 0.007]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            map={watermark}
            transparent
            opacity={0.38}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      <mesh position={[0, -h / 2 - 0.3, 0.025]}>
        <boxGeometry args={[Math.min(w + 0.12, 1.7), 0.2, 0.035]} />
        <meshStandardMaterial color={spec.plaque} roughness={0.75} metalness={spec.frameStyle === 'holographic' ? 0.35 : 0.05} />
      </mesh>

      {hasCrown && (
        <mesh position={[0, h / 2 + 0.36, 0.06]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#f0c85a" emissive="#7a5a12" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
      )}
    </group>
  )
}
