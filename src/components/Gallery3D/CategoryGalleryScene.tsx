import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { input, consumeLookDelta, addLookDelta } from '../../gallery/input'
import type { Artwork } from '../../types'
import type { CategoryId } from '../../types'
import { formatPrice } from '../../data/tariffs'

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
      <pointLight position={[0, h - 0.5, 0]} intensity={15} distance={20} color={theme.light} />
      <pointLight position={[-6, h - 1, 0]} intensity={8} distance={12} color={theme.light} />
      <pointLight position={[6, h - 1, 0]} intensity={8} distance={12} color={theme.light} />
    </group>
  )
}

function WallArt({ artwork, position, rotation }: { artwork: Artwork; position: [number, number, number]; rotation: [number, number, number] }) {
  const texture = useTexture(artwork.imageUrl)
  const aspect = artwork.width / artwork.height
  const h = 1.5
  const w = Math.min(h * aspect, 2.2)

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.06]} />
        <meshStandardMaterial color="#6b5a45" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.01]} userData={{ artwork }}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <Text position={[0, -h / 2 - 0.25, 0.03]} fontSize={0.1} color="#c9a962" anchorX="center" maxWidth={w + 0.3}>
        {artwork.title}
      </Text>
      <Text position={[0, -h / 2 - 0.42, 0.03]} fontSize={0.07} color="#a89f96" anchorX="center">
        {formatPrice(artwork.price)}
      </Text>
    </group>
  )
}

function getPositions(artworks: Artwork[]) {
  const items = artworks.slice(0, 10)
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
  const last = useRef<Artwork | null>(null)
  const bounds = { x: ROOM.w / 2 - 1.2, z: ROOM.d / 2 - 1.2 }

  useFrame((_, delta) => {
    const { lookX, lookY } = consumeLookDelta()
    yaw.current -= lookX
    pitch.current = THREE.MathUtils.clamp(pitch.current - lookY, -1.1, 1.1)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current

    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    const move = new THREE.Vector3()
    move.addScaledVector(fwd, input.forward * SPEED * delta)
    move.addScaledVector(right, input.right * SPEED * delta)
    pos.current.add(move)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -bounds.x, bounds.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -bounds.z, bounds.z)
    pos.current.y = EYE_H
    camera.position.copy(pos.current)

    ray.current.setFromCamera(new THREE.Vector2(0, 0), camera)
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

function MouseLook() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    let drag = false
    let lx = 0, ly = 0
    const down = (e: MouseEvent) => { if (e.button === 0) { drag = true; lx = e.clientX; ly = e.clientY; canvas.requestPointerLock?.() } }
    const up = () => { drag = false }
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) addLookDelta(e.movementX * 0.002, e.movementY * 0.002)
      else if (drag) { addLookDelta((e.clientX - lx) * 0.004, (e.clientY - ly) * 0.004); lx = e.clientX; ly = e.clientY }
    }
    canvas.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', move)
    return () => { canvas.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move) }
  }, [gl])
  return null
}

function SceneInner({ artworks, theme, onSelect }: GallerySceneProps) {
  const t = THEMES[theme] ?? THEMES.classic
  const positions = useMemo(() => getPositions(artworks), [artworks])

  return (
    <>
      <ambientLight intensity={0.4} />
      <fog attach="fog" args={[t.ceiling, 8, 22]} />
      <color attach="background" args={[t.ceiling]} />
      <Room theme={t} />
      <Suspense fallback={null}>
        {positions.map(({ artwork, position, rotation }) => (
          <WallArt key={artwork.id} artwork={artwork} position={position} rotation={rotation} />
        ))}
      </Suspense>
      <Controller onHover={onSelect} />
      <MouseLook />
    </>
  )
}

export default function CategoryGalleryScene({ artworks, theme, onSelect }: GallerySceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 70, near: 0.1, far: 50, position: [0, EYE_H, 5] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneInner artworks={artworks} theme={theme} onSelect={onSelect} />
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
