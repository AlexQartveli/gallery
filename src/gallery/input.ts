export interface InputState {
  forward: number
  right: number
  lookX: number
  lookY: number
  keys: Record<string, boolean>
}

export const input: InputState = {
  forward: 0,
  right: 0,
  lookX: 0,
  lookY: 0,
  keys: {},
}

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [1, 0],
  ArrowUp: [1, 0],
  KeyS: [-1, 0],
  ArrowDown: [-1, 0],
  KeyA: [0, -1],
  ArrowLeft: [0, -1],
  KeyD: [0, 1],
  ArrowRight: [0, 1],
}

function updateFromKeys() {
  let forward = 0
  let right = 0
  for (const [key, [f, r]] of Object.entries(MOVE_KEYS)) {
    if (input.keys[key]) {
      forward += f
      right += r
    }
  }
  const len = Math.hypot(forward, right)
  if (len > 0) {
    forward /= len
    right /= len
  }
  input.forward = forward
  input.right = right
}

export function initKeyboardInput() {
  const onDown = (e: KeyboardEvent) => {
    if (MOVE_KEYS[e.code]) {
      input.keys[e.code] = true
      updateFromKeys()
      e.preventDefault()
    }
  }
  const onUp = (e: KeyboardEvent) => {
    if (MOVE_KEYS[e.code]) {
      input.keys[e.code] = false
      updateFromKeys()
    }
  }
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    input.forward = 0
    input.right = 0
    input.keys = {}
  }
}

export function setJoystickInput(forward: number, right: number) {
  const hasKeys = Object.values(input.keys).some(Boolean)
  if (!hasKeys) {
    input.forward = forward
    input.right = right
  }
}

export function addLookDelta(x: number, y: number) {
  input.lookX += x
  input.lookY += y
}

export function consumeLookDelta() {
  const { lookX, lookY } = input
  input.lookX = 0
  input.lookY = 0
  return { lookX, lookY }
}
