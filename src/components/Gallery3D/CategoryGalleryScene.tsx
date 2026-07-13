import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { input, consumeLookDelta, addLookDelta } from '../../gallery/input'
import { useArtworkTexture, getWatermarkOverlayTexture } from '../../lib/artworkTexture'
import type { Artwork, CategoryId } from '../../types'
import { isBoostActive } from '../../data/boosts'

const EYE_H = 1.6
const SPEED = 4.5
const ROOM = { w: 11, d: 42, h: 4.5 }

interface Theme {
  wall: string
  wallAccent: string
  floor: string
  ceiling: string
  accent: string
  light: string
  trim: string
  plaque: string
  fogNear: number
  fogFar: number
}

const THEMES: Record<string, Theme> = {
  classic: {
    wall: '#4a4038',
    wallAccent: '#3a342e',
    floor: '#2f2820',
    ceiling: '#1f1b17',
    accent: '#c9a962',
    light: '#fff1d6',
    trim: '#8b7355',
    plaque: '#2a2520',
    fogNear: 12,
    fogFar: 28,
  },
  marble: {
    wall: '#ece7e1',
    wallAccent: '#ddd6ce',
    floor: '#cfc7be',
    ceiling: '#faf8f5',
    accent: '#8b7355',
    light: '#ffffff',
    trim: '#b8aea3',
    plaque: '#e8e2db',
    fogNear: 14,
    fogFar: 30,
  },
  modern: {
    wall: '#242424',
    wallAccent: '#181818',
    floor: '#121212',
    ceiling: '#0a0a0a',
    accent: '#ffffff',
    light: '#f5f5f5',
    trim: '#555555',
    plaque: '#1a1a1a',
    fogNear: 10,
    fogFar: 24,
  },
  minimal: {
    wall: '#f3f3f3',
    wallAccent: '#e8e8e8',
    floor: '#ececec',
    ceiling: '#ffffff',
    accent: '#333333',
    light: '#ffffff',
    trim: '#cccccc',
    plaque: '#f7f7f7',
    fogNear: 14,
    fogFar: 30,
  },
  neon: {
    wall: '#121228',
    wallAccent: '#0d0d1a',
    floor: '#0a0a14',
    ceiling: '#05050c',
    accent: '#00ffcc',
    light: '#9f7bff',
    trim: '#00ffcc',
    plaque: '#10101f',
    fogNear: 8,
    fogFar: 22,
  },
  warm: {
    wall: '#5a4030',
    wallAccent: '#4a3528',
    floor: '#3d2b1f',
    ceiling: '#2a1e15',
    accent: '#d4845a',
    light: '#ffecd2',
    trim: '#b8956a',
    plaque: '#35261c',
    fogNear: 11,
    fogFar: 26,
  },
  cozy: {
    wall: '#4a3a30',
    wallAccent: '#3d3028',
    floor: '#2e241c',
    ceiling: '#1f1812',
    accent: '#b8956a',
    light: '#ffe4c4',
    trim: '#8f7358',
    plaque: '#2b221b',
    fogNear: 11,
    fogFar: 26,
  },
}

interface GallerySceneProps {
  artworks: Artwork[]
  theme: string
  selectedId?: string | null
  onSelect: (artwork: Artwork | null) => void
  onOpenArtwork?: (artwork: Artwork) => void
  onFatalError?: (error: Error) => void
}

function Room({ theme }: { theme: Theme }) {
  const { w, d, h } = ROOM
  const hw = w / 2 - 0.35
  const isNeon = theme.accent === '#00ffcc'

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={theme.floor} roughness={0.55} metalness={0.08} />
      </mesh>

      {/* Floor inlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[2.4, d * 0.82]} />
        <meshStandardMaterial color={theme.wallAccent} roughness={0.75} metalness={0.04} />
      </mesh>

      {[
        [0, h / 2, -d / 2, w, h, 0.24],
        [0, h / 2, d / 2, w, h, 0.24],
        [-w / 2, h / 2, 0, 0.24, h, d],
        [w / 2, h / 2, 0, 0.24, h, d],
      ].map(([x, y, z, width, height, depth], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={theme.wall} roughness={0.92} />
          </mesh>
          <mesh position={[0, -height / 2 + 0.12, depth > 0.3 ? depth / 2 + 0.02 : 0]}>
            <boxGeometry args={[width * 0.98, 0.24, depth > 0.3 ? 0.08 : width * 0.98]} />
            <meshStandardMaterial color={theme.trim} roughness={0.45} metalness={0.2} />
          </mesh>
          <mesh position={[0, height / 2 - 0.1, depth > 0.3 ? depth / 2 + 0.02 : 0]}>
            <boxGeometry args={[width * 0.98, 0.18, depth > 0.3 ? 0.06 : width * 0.98]} />
            <meshStandardMaterial color={theme.trim} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={theme.ceiling} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>

      {/* Ceiling coffers */}
      {[-14, -7, 0, 7, 14].map((z) => (
        <mesh key={z} rotation={[Math.PI / 2, 0, 0]} position={[0, h - 0.05, z]}>
          <planeGeometry args={[w * 0.72, 5.8]} />
          <meshStandardMaterial color={theme.wallAccent} roughness={0.9} />
        </mesh>
      ))}

      {/* Ceiling lights */}
      {[-15, -7.5, 0, 7.5, 15].map((z) => (
        <group key={z} position={[0, h - 0.35, z]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.5, 0.18, 24]} />
            <meshStandardMaterial color={theme.trim} roughness={0.25} metalness={0.65} emissive={theme.light} emissiveIntensity={isNeon ? 0.35 : 0.12} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={isNeon ? 14 : 10} distance={16} color={theme.light} />
        </group>
      ))}

      {isNeon && (
        <>
          <mesh position={[-hw + 0.2, 0.03, 0]}>
            <boxGeometry args={[0.08, 0.04, d * 0.84]} />
            <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[hw - 0.2, 0.03, 0]}>
            <boxGeometry args={[0.08, 0.04, d * 0.84]} />
            <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={1.2} />
          </mesh>
        </>
      )}
    </group>
  )
}

function WallArt({
  artwork,
  position,
  rotation,
  theme,
  selected,
}: {
  artwork: Artwork
  position: [number, number, number]
  rotation: [number, number, number]
  theme: Theme
  selected: boolean
}) {
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
  const frameColor = hasCrown ? '#b89452' : '#6f5842'
  const frameMetalness = hasCrown ? 0.55 : 0.25

  return (
    <group position={position} rotation={rotation}>
      {hasSpotlight && (
        <spotLight
          position={[0, 1.35, 0.75]}
          angle={0.42}
          penumbra={0.75}
          intensity={selected ? 7 : 5}
          distance={7}
          color="#fff8e7"
          castShadow={false}
        />
      )}

      {/* Picture light */}
      <mesh position={[0, h / 2 + 0.22, 0.12]} rotation={[Math.PI / 2.2, 0, 0]}>
        <boxGeometry args={[0.42, 0.08, 0.16]} />
        <meshStandardMaterial
          color={theme.trim}
          roughness={0.2}
          metalness={0.7}
          emissive={selected ? theme.accent : '#000000'}
          emissiveIntensity={selected ? 0.45 : 0}
        />
      </mesh>

      {/* Outer frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[w + 0.22, h + 0.22, 0.08]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={0.35}
          metalness={frameMetalness}
          emissive={selected ? theme.accent : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      </mesh>

      {/* Mat */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.02]} />
        <meshStandardMaterial color="#ddd4c8" roughness={0.95} />
      </mesh>

      {/* Canvas */}
      <mesh position={[0, 0, 0.015]} userData={{ artwork }} material={canvasMaterial}>
        <planeGeometry args={[w, h]} />
      </mesh>

      {texture && (
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            map={watermark}
            transparent
            opacity={0.42}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Plaque */}
      <mesh position={[0, -h / 2 - 0.28, 0.02]}>
        <boxGeometry args={[Math.min(w + 0.1, 1.6), 0.18, 0.04]} />
        <meshStandardMaterial color={theme.plaque} roughness={0.8} metalness={0.05} />
      </mesh>

      {hasCrown && (
        <mesh position={[0, h / 2 + 0.34, 0.06]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#f0c85a" emissive="#7a5a12" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
        </mesh>
      )}
    </group>
  )
}

function getPositions(artworks: Artwork[]) {
  const sorted = [...artworks].sort((a, b) => {
    const aV = (isBoostActive(a.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(a.vipBoosts?.spotlight) ? 1 : 0)
    const bV = (isBoostActive(b.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(b.vipBoosts?.spotlight) ? 1 : 0)
    return bV - aV
  })
  const items = sorted.slice(0, 12)
  const positions: { artwork: Artwork; position: [number, number, number]; rotation: [number, number, number] }[] = []
  const y = 1.85
  const hw = ROOM.w / 2 - 0.35
  const spacing = 6.8
  const rows = Math.ceil(items.length / 2)
  const startZ = -((rows - 1) * spacing) / 2

  items.forEach((artwork, index) => {
    const row = Math.floor(index / 2)
    const onLeft = index % 2 === 0
    const z = startZ + row * spacing
    positions.push({
      artwork,
      position: [onLeft ? -hw : hw, y, z],
      rotation: [0, onLeft ? Math.PI / 2 : -Math.PI / 2, 0],
    })
  })

  return positions
}

function Controller({
  onHover,
  onOpenArtwork,
}: {
  onHover: (a: Artwork | null) => void
  onOpenArtwork?: (a: Artwork) => void
}) {
  const { camera, scene, gl } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(0)
  const pos = useRef(new THREE.Vector3(0, EYE_H, ROOM.d / 2 - 2.5))
  const ray = useRef(new THREE.Raycaster())
  const fwd = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector2(0, 0))
  const last = useRef<Artwork | null>(null)
  const bounds = { x: ROOM.w / 2 - 1.1, z: ROOM.d / 2 - 1.4 }

  useFrame((_, delta) => {
    const { lookX, lookY } = consumeLookDelta()
    yaw.current -= lookX
    pitch.current = THREE.MathUtils.clamp(pitch.current - lookY, -1.1, 1.1)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current

    fwd.current.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    right.current.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    move.current.set(0, 0, 0)
    move.current.addScaledVector(fwd.current, input.forward * SPEED * delta)
    move.current.addScaledVector(right.current, input.right * SPEED * delta)
    pos.current.add(move.current)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -bounds.x, bounds.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -bounds.z, bounds.z)
    pos.current.y = EYE_H
    camera.position.copy(pos.current)

    ray.current.setFromCamera(center.current, camera)
    const hits = ray.current.intersectObjects(scene.children, true)
    let found: Artwork | null = null
    for (const hit of hits) {
      if (hit.object.userData?.artwork) {
        found = hit.object.userData.artwork as Artwork
        break
      }
    }
    if (found !== last.current) {
      last.current = found
      onHover(found)
    }
  })

  useEffect(() => {
    const canvas = gl.domElement
    let pointerDown = false
    let startX = 0
    let startY = 0
    let moved = false

    const tryOpen = () => {
      if (!moved && last.current) {
        onOpenArtwork?.(last.current)
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true
      moved = false
      startX = event.clientX
      startY = event.clientY
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) return
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) {
        moved = true
      }
    }

    const onPointerUp = () => {
      if (pointerDown) tryOpen()
      pointerDown = false
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gl, onOpenArtwork])

  return null
}

function TouchLook() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    let activeTouch: number | null = null
    let lastX = 0
    let lastY = 0

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      activeTouch = event.touches[0].identifier
      lastX = event.touches[0].clientX
      lastY = event.touches[0].clientY
    }

    const onTouchMove = (event: TouchEvent) => {
      if (activeTouch === null) return
      const touch = [...event.touches].find((t) => t.identifier === activeTouch)
      if (!touch) return
      addLookDelta((touch.clientX - lastX) * 0.004, (touch.clientY - lastY) * 0.004)
      lastX = touch.clientX
      lastY = touch.clientY
    }

    const onTouchEnd = () => {
      activeTouch = null
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [gl])

  return null
}

function MouseLook() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    let drag = false
    let lx = 0
    let ly = 0
    const down = (e: MouseEvent) => {
      if (e.button === 0) {
        drag = true
        lx = e.clientX
        ly = e.clientY
        canvas.requestPointerLock?.()
      }
    }
    const up = () => {
      drag = false
    }
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        addLookDelta(e.movementX * 0.002, e.movementY * 0.002)
      } else if (drag) {
        addLookDelta((e.clientX - lx) * 0.004, (e.clientY - ly) * 0.004)
        lx = e.clientX
        ly = e.clientY
      }
    }
    canvas.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', move)
    return () => {
      canvas.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('mousemove', move)
    }
  }, [gl])
  return null
}

function SceneInner({ artworks, theme, selectedId, onSelect, onOpenArtwork }: GallerySceneProps) {
  const t = THEMES[theme] ?? THEMES.classic
  const positions = useMemo(() => getPositions(artworks), [artworks])
  const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={[t.light, t.floor, 0.28]} />
      <directionalLight position={[0, 6, 4]} intensity={0.35} color={t.light} />
      <fog attach="fog" args={[t.ceiling, t.fogNear, Math.max(t.fogFar, ROOM.d - 2)]} />
      <color attach="background" args={[t.ceiling]} />
      <Room theme={t} />
      {positions.map(({ artwork, position, rotation }) => (
        <WallArt
          key={artwork.id}
          artwork={artwork}
          position={position}
          rotation={rotation}
          theme={t}
          selected={selectedId === artwork.id}
        />
      ))}
      <Controller onHover={onSelect} onOpenArtwork={onOpenArtwork} />
      {isCoarsePointer ? <TouchLook /> : <MouseLook />}
    </>
  )
}

export default function CategoryGalleryScene({ artworks, theme, selectedId, onSelect, onOpenArtwork, onFatalError }: GallerySceneProps) {
  return (
    <Canvas
      dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
      camera={{ fov: 68, near: 0.1, far: 60, position: [0, EYE_H, ROOM.d / 2 - 2.5] }}
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
  const map: Record<CategoryId, string> = {
    painting: 'classic',
    sculpture: 'marble',
    photography: 'modern',
    graphics: 'minimal',
    digital: 'neon',
    ceramics: 'warm',
    textile: 'cozy',
  }
  return map[categoryId] ?? 'classic'
}

export function getThemeLabel(theme: string): string {
  const labels: Record<string, string> = {
    classic: 'Классический зал',
    marble: 'Мраморный зал',
    modern: 'Современная экспозиция',
    minimal: 'Минималистичная галерея',
    neon: 'Неоновый павильон',
    warm: 'Тёплый интерьер',
    cozy: 'Уютная мастерская',
  }
  return labels[theme] ?? 'Галерея'
}
