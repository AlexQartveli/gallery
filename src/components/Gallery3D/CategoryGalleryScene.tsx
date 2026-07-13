import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { input, consumeLookDelta, addLookDelta } from '../../gallery/input'
import type { Artwork, CategoryId } from '../../types'
import { isBoostActive } from '../../data/boosts'

const EYE_H = 1.6
const SPEED = 4
const ROOM = { w: 24, d: 16, h: 4.5 }

interface Theme {
  wall: string
  floor: string
  ceiling: string
  accent: string
  light: string
}

const THEMES: Record<string, Theme> = {
  classic: { wall: '#3a342e', floor: '#2a2520', ceiling: '#1a1714', accent: '#c9a962', light: '#fff5e0' },
  marble: { wall: '#e8e4df', floor: '#d4cfc8', ceiling: '#f5f3f0', accent: '#8b7355', light: '#ffffff' },
  modern: { wall: '#1a1a1a', floor: '#111111', ceiling: '#0a0a0a', accent: '#ffffff', light: '#f0f0f0' },
  minimal: { wall: '#f5f5f5', floor: '#eeeeee', ceiling: '#ffffff', accent: '#333333', light: '#ffffff' },
  neon: { wall: '#0d0d1a', floor: '#0a0a12', ceiling: '#050508', accent: '#00ffcc', light: '#8866ff' },
  warm: { wall: '#4a3528', floor: '#3d2b1f', ceiling: '#2a1e15', accent: '#d4845a', light: '#ffecd2' },
  cozy: { wall: '#3d3028', floor: '#2e241c', ceiling: '#1f1812', accent: '#b8956a', light: '#ffe4c4' },
}

interface GallerySceneProps {
  artworks: Artwork[]
  theme: string
  onSelect: (artwork: Artwork | null) => void
  onFatalError?: (error: Error) => void
}

function Room({ theme }: { theme: Theme }) {
  const { w, d, h } = ROOM
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={theme.floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, 0.2]} />
        <meshStandardMaterial color={theme.wall} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]}>
        <boxGeometry args={[w, h, 0.2]} />
        <meshStandardMaterial color={theme.wall} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[0.2, h, d]} />
        <meshStandardMaterial color={theme.wall} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[0.2, h, d]} />
        <meshStandardMaterial color={theme.wall} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={theme.ceiling} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, h - 0.5, 0]} intensity={18} distance={24} color={theme.light} />
      <pointLight position={[-6, h - 1, 0]} intensity={10} distance={14} color={theme.light} />
      <pointLight position={[6, h - 1, 0]} intensity={10} distance={14} color={theme.light} />
    </group>
  )
}

function useArtworkTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let active = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (loaded) => {
        if (!active) {
          loaded.dispose()
          return
        }
        loaded.colorSpace = THREE.SRGBColorSpace
        setTexture(loaded)
      },
      undefined,
      () => {
        if (active) setTexture(null)
      }
    )

    return () => {
      active = false
    }
  }, [url])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  return texture
}

function WallArt({ artwork, position, rotation }: { artwork: Artwork; position: [number, number, number]; rotation: [number, number, number] }) {
  const texture = useArtworkTexture(artwork.imageUrl)
  const aspect = artwork.width / artwork.height
  const h = 1.5
  const w = Math.min(h * aspect, 2.2)
  const hasCrown = isBoostActive(artwork.vipBoosts?.crown)
  const hasSpotlight = isBoostActive(artwork.vipBoosts?.spotlight)

  return (
    <group position={position} rotation={rotation}>
      {hasSpotlight && (
        <spotLight
          position={[0, 1.2, 0.8]}
          angle={0.5}
          penumbra={0.6}
          intensity={4}
          distance={6}
          color="#fff8e7"
          castShadow={false}
        />
      )}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.06]} />
        <meshStandardMaterial
          color={hasCrown ? '#9a7b4f' : '#6b5a45'}
          roughness={0.7}
          emissive={hasSpotlight ? '#332200' : '#000000'}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]} userData={{ artwork }}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? '#ffffff' : '#4a4038'} />
      </mesh>
    </group>
  )
}

function getPositions(artworks: Artwork[]) {
  const sorted = [...artworks].sort((a, b) => {
    const aV = (isBoostActive(a.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(a.vipBoosts?.spotlight) ? 1 : 0)
    const bV = (isBoostActive(b.vipBoosts?.crown) ? 2 : 0) + (isBoostActive(b.vipBoosts?.spotlight) ? 1 : 0)
    return bV - aV
  })
  const items = sorted.slice(0, 10)
  const positions: { artwork: Artwork; position: [number, number, number]; rotation: [number, number, number] }[] = []
  const y = 1.8
  const hw = ROOM.w / 2 - 0.3
  const hd = ROOM.d / 2 - 0.3

  items.slice(0, 4).forEach((a, i) => {
    positions.push({ artwork: a, position: [-7 + i * 4.5, y, -hd], rotation: [0, 0, 0] })
  })
  items.slice(4, 7).forEach((a, i) => {
    positions.push({ artwork: a, position: [-7 + i * 4.5, y, hd], rotation: [0, Math.PI, 0] })
  })
  items.slice(7, 10).forEach((a, i) => {
    positions.push({ artwork: a, position: [-hw, y, -4 + i * 4], rotation: [0, Math.PI / 2, 0] })
  })

  return positions
}

function Controller({ onHover }: { onHover: (a: Artwork | null) => void }) {
  const { camera, scene } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(0)
  const pos = useRef(new THREE.Vector3(0, EYE_H, 5))
  const ray = useRef(new THREE.Raycaster())
  const fwd = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector2(0, 0))
  const last = useRef<Artwork | null>(null)
  const bounds = { x: ROOM.w / 2 - 1.2, z: ROOM.d / 2 - 1.2 }

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

function SceneInner({ artworks, theme, onSelect }: GallerySceneProps) {
  const t = THEMES[theme] ?? THEMES.classic
  const positions = useMemo(() => getPositions(artworks), [artworks])
  const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={[t.light, t.floor, 0.35]} />
      <fog attach="fog" args={[t.ceiling, 10, 24]} />
      <color attach="background" args={[t.ceiling]} />
      <Room theme={t} />
      {positions.map(({ artwork, position, rotation }) => (
        <WallArt key={artwork.id} artwork={artwork} position={position} rotation={rotation} />
      ))}
      <Controller onHover={onSelect} />
      {isCoarsePointer ? <TouchLook /> : <MouseLook />}
    </>
  )
}

export default function CategoryGalleryScene({ artworks, theme, onSelect, onFatalError }: GallerySceneProps) {
  return (
    <Canvas
      dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
      camera={{ fov: 70, near: 0.1, far: 50, position: [0, EYE_H, 5] }}
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
      <SceneInner artworks={artworks} theme={theme} onSelect={onSelect} onFatalError={onFatalError} />
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
