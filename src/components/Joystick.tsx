import { useRef, useCallback } from 'react'
import { setJoystickInput } from '../gallery/input'
import './Joystick.css'

interface JoystickProps {
  onLook?: (dx: number, dy: number) => void
}

export default function Joystick({ onLook }: JoystickProps) {
  const stickRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(false)
  const touchIdRef = useRef<number | null>(null)
  const originRef = useRef({ x: 0, y: 0 })

  const resetStick = useCallback(() => {
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(-50%, -50%)'
    }
    setJoystickInput(0, 0)
    activeRef.current = false
    touchIdRef.current = null
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current || !stickRef.current) return
    const rect = baseRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const maxDist = rect.width / 2 - 16

    let dx = clientX - cx
    let dy = clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist
      dy = (dy / dist) * maxDist
    }

    stickRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    setJoystickInput(-dy / maxDist, dx / maxDist)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    touchIdRef.current = touch.identifier
    activeRef.current = true
    originRef.current = { x: touch.clientX, y: touch.clientY }
    handleMove(touch.clientX, touch.clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!activeRef.current) return
    const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current)
    if (touch) handleMove(touch.clientX, touch.clientY)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchIdRef.current)
    if (touch) resetStick()
  }

  return (
    <>
      <div
        ref={baseRef}
        className="joystick"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div ref={stickRef} className="joystick__stick" />
      </div>

      <div
        className="look-zone"
        onTouchStart={(e) => {
          const touch = e.changedTouches[0]
          originRef.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          const touch = e.changedTouches[0]
          const dx = touch.clientX - originRef.current.x
          const dy = touch.clientY - originRef.current.y
          originRef.current = { x: touch.clientX, y: touch.clientY }
          onLook?.(dx * 0.004, dy * 0.004)
        }}
      />
    </>
  )
}
