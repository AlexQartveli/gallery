import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { input, consumeLookDelta, addLookDelta } from '../../gallery/input'
import type { Painting } from '../../data/paintings'
import { formatPrice } from '../../data/paintings'

const ROOM_W = 32
const ROOM_D = 24
const WALL_H = 5
const EYE_H = 1.65
const SPEED = 4.5
const BOUNDS = { x: ROOM_W / 2 - 1, z: ROOM_D / 2 - 1 }

interface GallerySceneProps {
  paintings: Painting[]
  onSelect: (painting: Painting | null) => void
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#2a2520" roughness={0.8} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => (
          <mesh
            key={`tile-${i}-${j}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-ROOM_W / 2 + 2 + i * 4, 0.01, -ROOM_D / 2 + 2 + j * 4]}
          >
            <planeGeometry args={[3.8, 3.8]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#322c26' : '#2a2520'} roughness={0.9} />
          </mesh>
        ))
      )}
    </>
  )
}

function Walls() {
  const wallColor = '#3d3630'
  return (
    <group>
      <mesh position={[0, WALL_H / 2, -ROOM_D / 2]}>
        <boxGeometry args={[ROOM_W, WALL_H, 0.3]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[0, WALL_H / 2, ROOM_D / 2]}>
        <boxGeometry args={[ROOM_W, WALL_H, 0.3]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[-ROOM_W / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[0.3, WALL_H, ROOM_D]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[ROOM_W / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[0.3, WALL_H, ROOM_D]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#1a1714" side={THREE.DoubleSide} />
      </mesh>
      {[-12, -4, 4, 12].map((x) => (
        <pointLight key={`light-${x}`} position={[x, WALL_H - 0.5, 0]} intensity={12} distance={14} color="#fff5e6" />
      ))}
    </group>
  )
}

interface WallPaintingProps {
  painting: Painting
  position: [number, number, number]
  rotation: [number, number, number]
}

function WallPainting({ painting, position, rotation }: WallPaintingProps) {
  const texture = useTexture(painting.imageUrl)
  const aspect = painting.width / painting.height
  const h = 1.8
  const w = h * aspect

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.2, h + 0.2, 0.08]} />
        <meshStandardMaterial color="#8b7355" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.01]} userData={{ painting }}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <Text position={[0, -h / 2 - 0.35, 0.05]} fontSize={0.12} color="#c9a962" anchorX="center" maxWidth={w + 0.5}>
        {painting.title}
      </Text>
      <Text position={[0, -h / 2 - 0.55, 0.05]} fontSize={0.09} color="#a89f96" anchorX="center">
        {formatPrice(painting.price)}
      </Text>
    </group>
  )
}

function getPaintingPositions(paintings: Painting[]) {
  const positions: {
    painting: Painting
    position: [number, number, number]
    rotation: [number, number, number]
  }[] = []
  const wallY = 2.2
  const halfW = ROOM_W / 2 - 0.5
  const halfD = ROOM_D / 2 - 0.5

  paintings.slice(0, 6).forEach((p, i) => {
    positions.push({ painting: p, position: [-10 + i * 4, wallY, -halfD], rotation: [0, 0, 0] })
  })
  paintings.slice(6, 12).forEach((p, i) => {
    positions.push({ painting: p, position: [-10 + i * 4, wallY, halfD], rotation: [0, Math.PI, 0] })
  })
  paintings.slice(12, 18).forEach((p, i) => {
    positions.push({ painting: p, position: [-halfW, wallY, -8 + i * 3.5], rotation: [0, Math.PI / 2, 0] })
  })
  paintings.slice(18, 24).forEach((p, i) => {
    positions.push({ painting: p, position: [halfW, wallY, -8 + i * 3.5], rotation: [0, -Math.PI / 2, 0] })
  })

  return positions
}

function FirstPersonController({ onHover }: { onHover: (p: Painting | null) => void }) {
  const { camera, scene } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(0)
  const pos = useRef(new THREE.Vector3(0, EYE_H, 8))
  const raycaster = useRef(new THREE.Raycaster())
  const lastHovered = useRef<Painting | null>(null)

  useFrame((_, delta) => {
    const { lookX, lookY } = consumeLookDelta()
    yaw.current -= lookX
    pitch.current = Math.max(-1.2, Math.min(1.2, pitch.current - lookY))

    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)

    const move = new THREE.Vector3()
    move.addScaledVector(forward, input.forward * SPEED * delta)
    move.addScaledVector(right, input.right * SPEED * delta)

    pos.current.add(move)
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUNDS.x, BOUNDS.x)
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -BOUNDS.z, BOUNDS.z)
    pos.current.y = EYE_H
    camera.position.copy(pos.current)

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
    const hits = raycaster.current.intersectObjects(scene.children, true)
    let found: Painting | null = null
    for (const hit of hits) {
      if (hit.object.userData?.painting) {
        found = hit.object.userData.painting as Painting
        break
      }
    }
    if (found !== lastHovered.current) {
      lastHovered.current = found
      onHover(found)
    }
  })

  return null
}

function MouseLook() {
  const { gl } = useThree()
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = gl.domElement

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        dragging.current = true
        last.current = { x: e.clientX, y: e.clientY }
        canvas.requestPointerLock?.()
      }
    }

    const onMouseUp = () => {
      dragging.current = false
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        addLookDelta(e.movementX * 0.002, e.movementY * 0.002)
      } else if (dragging.current) {
        addLookDelta((e.clientX - last.current.x) * 0.004, (e.clientY - last.current.y) * 0.004)
        last.current = { x: e.clientX, y: e.clientY }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl])

  return null
}

function SceneContent({ paintings, onSelect }: GallerySceneProps) {
  const available = paintings.filter((p) => p.status === 'available').slice(0, 24)
  const positions = getPaintingPositions(available)

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} castShadow />
      <Floor />
      <Walls />
      <Suspense fallback={null}>
        {positions.map(({ painting, position, rotation }) => (
          <WallPainting
            key={painting.id}
            painting={painting}
            position={position}
            rotation={rotation}
          />
        ))}
      </Suspense>
      <FirstPersonController onHover={onSelect} />
      <MouseLook />
    </>
  )
}

export default function GalleryScene({ paintings, onSelect }: GallerySceneProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 100, position: [0, EYE_H, 8] }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0f0e0d']} />
      <fog attach="fog" args={['#0f0e0d', 15, 35]} />
      <SceneContent paintings={paintings} onSelect={onSelect} />
    </Canvas>
  )
}
