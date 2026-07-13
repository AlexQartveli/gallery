import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Artwork, CategoryId } from '../../types'
import { isBoostActive } from '../../data/boosts'
import { CORRIDOR, EYE_H, ART_SPACING, MAX_WALL_ART } from './constants'
import GalleryRoom from './rooms/GalleryRoom'
import { getRoomForCategory, getRoomSpec, ROOM_SPECS } from './rooms/specs'
import type { GalleryRoomId } from './rooms/types'
import WallArt from './WallArt'
import { GalleryController, TouchLook, MouseLook } from './controls'

interface GallerySceneProps {
  artworks: Artwork[]
  theme: string
  selectedId?: string | null
  onSelect: (artwork: Artwork | null) => void
  onOpenArtwork?: (artwork: Artwork) => void
  onFatalError?: (error: Error) => void
}

function getPositions(artworks: Artwork[]) {
  const sorted = [...artworks].sort((a, b) => {
    const aV = (isBoostActive(a.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(a.vipBoosts?.spotlight) ? 1 : 0)
    const bV = (isBoostActive(b.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(b.vipBoosts?.spotlight) ? 1 : 0)
    return bV - aV
  })
  const items = sorted.slice(0, MAX_WALL_ART)
  const positions: { artwork: Artwork; position: [number, number, number]; rotation: [number, number, number] }[] = []
  const y = 1.88
  const hw = CORRIDOR.w / 2 - 0.32
  const rows = Math.ceil(items.length / 2)
  const startZ = -((rows - 1) * ART_SPACING) / 2

  items.forEach((artwork, index) => {
    const row = Math.floor(index / 2)
    const onLeft = index % 2 === 0
    const z = startZ + row * ART_SPACING
    positions.push({
      artwork,
      position: [onLeft ? -hw : hw, y, z],
      rotation: [0, onLeft ? Math.PI / 2 : -Math.PI / 2, 0],
    })
  })

  return positions
}

function SceneInner({ artworks, theme, selectedId, onSelect, onOpenArtwork }: GallerySceneProps) {
  const spec = ROOM_SPECS[theme as GalleryRoomId] ?? ROOM_SPECS.classic_realism
  const positions = useMemo(() => getPositions(artworks), [artworks])
  const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  return (
    <>
      <ambientLight intensity={spec.ambientIntensity} />
      <hemisphereLight args={[spec.light, spec.floor, spec.hemisphereIntensity]} />
      <directionalLight position={[0, 8, 6]} intensity={spec.directionalIntensity} color={spec.light} />
      <fog attach="fog" args={[spec.ceiling, spec.fogNear, Math.max(spec.fogFar, CORRIDOR.d - 2)]} />
      <color attach="background" args={[spec.ceiling]} />
      <GalleryRoom spec={spec} />
      {positions.map(({ artwork, position, rotation }) => (
        <WallArt
          key={artwork.id}
          artwork={artwork}
          position={position}
          rotation={rotation}
          spec={spec}
          selected={selectedId === artwork.id}
        />
      ))}
      <GalleryController onHover={onSelect} onOpenArtwork={onOpenArtwork} />
      {isCoarsePointer ? <TouchLook /> : <MouseLook />}
    </>
  )
}

export default function CategoryGalleryScene({ artworks, theme, selectedId, onSelect, onOpenArtwork, onFatalError }: GallerySceneProps) {
  return (
    <Canvas
      dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
      camera={{ fov: 62, near: 0.1, far: 72, position: [0, EYE_H, CORRIDOR.d / 2 - 2.8] }}
      gl={{
        antialias: false,
        powerPreference: 'default',
        alpha: false,
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        if (!gl.capabilities?.isWebGL2 && !gl.getContext()) {
          onFatalError?.(new Error('WebGL unavailable'))
        }
      }}
    >
      <SceneInner artworks={artworks} theme={theme} selectedId={selectedId} onSelect={onSelect} onOpenArtwork={onOpenArtwork} onFatalError={onFatalError} />
    </Canvas>
  )
}

export function getThemeForCategory(categoryId: CategoryId): string {
  return getRoomForCategory(categoryId)
}

export function getThemeLabel(theme: string): string {
  const spec = ROOM_SPECS[theme as GalleryRoomId]
  return spec?.label ?? 'Галерея'
}

export function getThemeSubtitle(theme: string): string {
  const spec = ROOM_SPECS[theme as GalleryRoomId]
  return spec?.subtitle ?? ''
}

export { getRoomSpec, ROOM_SPECS }
