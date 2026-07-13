import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { input, consumeLookDelta, addLookDelta } from '../../gallery/input'
import { CORRIDOR, EYE_H, SPEED } from './constants'
import type { Artwork } from '../../types'

export function GalleryController({
  onHover,
  onOpenArtwork,
}: {
  onHover: (a: Artwork | null) => void
  onOpenArtwork?: (a: Artwork) => void
}) {
  const { camera, scene, gl } = useThree()
  const yaw = useRef(0)
  const pitch = useRef(0)
  const pos = useRef(new THREE.Vector3(0, EYE_H, CORRIDOR.d / 2 - 2.8))
  const ray = useRef(new THREE.Raycaster())
  const fwd = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector2(0, 0))
  const last = useRef<Artwork | null>(null)
  const bounds = { x: CORRIDOR.w / 2 - 1, z: CORRIDOR.d / 2 - 1.2 }

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
      if (!moved && last.current) onOpenArtwork?.(last.current)
    }

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true
      moved = false
      startX = event.clientX
      startY = event.clientY
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) return
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) moved = true
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

export function TouchLook() {
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
    const onTouchEnd = () => { activeTouch = null }

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

export function MouseLook() {
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
    const up = () => { drag = false }
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
