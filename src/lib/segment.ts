export interface Bounds {
  top: number
  bottom: number
  left: number
  right: number
}

interface Rgb {
  r: number
  g: number
  b: number
}

function sampleRgb(data: Uint8ClampedArray, w: number, x: number, y: number): Rgb {
  const i = (y * w + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2] }
}

function colorDist(a: Rgb, b: Rgb): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((x, y) => x - y)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function estimateBackground(data: Uint8ClampedArray, w: number, h: number): Rgb {
  const samples: Rgb[] = []
  const pts = [
    [0.02, 0.02], [0.5, 0.02], [0.98, 0.02],
    [0.02, 0.5], [0.98, 0.5],
    [0.02, 0.98], [0.5, 0.98], [0.98, 0.98],
  ]
  for (const [px, py] of pts) {
    const x = Math.min(w - 1, Math.max(0, Math.round(w * px)))
    const y = Math.min(h - 1, Math.max(0, Math.round(h * py)))
    samples.push(sampleRgb(data, w, x, y))
  }
  return {
    r: median(samples.map((s) => s.r)),
    g: median(samples.map((s) => s.g)),
    b: median(samples.map((s) => s.b)),
  }
}

function rowBgRatio(data: Uint8ClampedArray, w: number, y: number, bg: Rgb, thresh: number, x0: number, x1: number): number {
  let bgCount = 0
  let n = 0
  for (let x = x0; x < x1; x += 2) {
    const c = sampleRgb(data, w, x, y)
    if (colorDist(c, bg) < thresh) bgCount++
    n++
  }
  return n ? bgCount / n : 1
}

function colBgRatio(data: Uint8ClampedArray, w: number, x: number, bg: Rgb, thresh: number, y0: number, y1: number): number {
  let bgCount = 0
  let n = 0
  for (let y = y0; y < y1; y += 2) {
    const c = sampleRgb(data, w, x, y)
    if (colorDist(c, bg) < thresh) bgCount++
    n++
  }
  return n ? bgCount / n : 1
}

export function detectBackgroundBounds(data: Uint8ClampedArray, w: number, h: number): Bounds {
  const bg = estimateBackground(data, w, h)
  const thresh = 42

  let top = 0
  for (let y = 0; y < Math.floor(h * 0.48); y++) {
    if (rowBgRatio(data, w, y, bg, thresh, 0, w) < 0.82) {
      top = y
      break
    }
  }

  let bottom = h
  for (let y = h - 1; y > Math.floor(h * 0.52); y--) {
    if (rowBgRatio(data, w, y, bg, thresh, 0, w) < 0.82) {
      bottom = y + 1
      break
    }
  }

  let left = 0
  for (let x = 0; x < Math.floor(w * 0.48); x++) {
    if (colBgRatio(data, w, x, bg, thresh, top, bottom) < 0.82) {
      left = x
      break
    }
  }

  let right = w
  for (let x = w - 1; x > Math.floor(w * 0.52); x--) {
    if (colBgRatio(data, w, x, bg, thresh, top, bottom) < 0.82) {
      right = x + 1
      break
    }
  }

  if (right - left < w * 0.4 || bottom - top < h * 0.4) {
    return { top: 0, bottom: h, left: 0, right: w }
  }

  return { top, bottom, left, right }
}

function isFrameLike(c: Rgb): boolean {
  const { r, g, b } = c
  if (r > 70 && r < 210 && g < r * 0.88 && b < r * 0.8 && r - g > 8) return true
  if (r > 195 && g > 185 && b > 155 && Math.max(r, g, b) - Math.min(r, g, b) < 40) return true
  return false
}

function rowFrameRatio(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number): number {
  let n = 0
  let frame = 0
  for (let x = x0; x < x1; x += 2) {
    if (isFrameLike(sampleRgb(data, w, x, y))) frame++
    n++
  }
  return n ? frame / n : 0
}

function colFrameRatio(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number): number {
  let n = 0
  let frame = 0
  for (let y = y0; y < y1; y += 2) {
    if (isFrameLike(sampleRgb(data, w, x, y))) frame++
    n++
  }
  return n ? frame / n : 0
}

export function detectPaintingBounds(data: Uint8ClampedArray, w: number, _h: number, outer: Bounds): Bounds {
  const x0 = Math.floor(outer.left + (outer.right - outer.left) * 0.05)
  const x1 = Math.floor(outer.left + (outer.right - outer.left) * 0.95)
  const y0 = Math.floor(outer.top + (outer.bottom - outer.top) * 0.05)
  const y1 = Math.floor(outer.top + (outer.bottom - outer.top) * 0.95)
  const maxScan = Math.floor(Math.min(outer.right - outer.left, outer.bottom - outer.top) * 0.28)

  let top = outer.top
  for (let y = outer.top; y < outer.top + maxScan; y++) {
    if (rowFrameRatio(data, w, y, x0, x1) > 0.45) continue
    if (rowFrameRatio(data, w, y + 1, x0, x1) < 0.38) {
      top = y + 2
      break
    }
  }

  let bottom = outer.bottom
  for (let y = outer.bottom - 1; y > outer.bottom - maxScan; y--) {
    if (rowFrameRatio(data, w, y, x0, x1) > 0.45) continue
    if (rowFrameRatio(data, w, y - 1, x0, x1) < 0.38) {
      bottom = y - 1
      break
    }
  }

  let left = outer.left
  for (let x = outer.left; x < outer.left + maxScan; x++) {
    if (colFrameRatio(data, w, x, y0, y1) > 0.45) continue
    if (colFrameRatio(data, w, x + 1, y0, y1) < 0.38) {
      left = x + 2
      break
    }
  }

  let right = outer.right
  for (let x = outer.right - 1; x > outer.right - maxScan; x--) {
    if (colFrameRatio(data, w, x, y0, y1) > 0.45) continue
    if (colFrameRatio(data, w, x - 1, y0, y1) < 0.38) {
      right = x - 1
      break
    }
  }

  const inset = Math.max(3, Math.round(Math.min(right - left, bottom - top) * 0.012))
  top = Math.min(bottom - 4, top + inset)
  bottom = Math.max(top + 4, bottom - inset)
  left = Math.min(right - 4, left + inset)
  right = Math.max(left + 4, right - inset)

  const minW = (outer.right - outer.left) * 0.42
  const minH = (outer.bottom - outer.top) * 0.42
  if (right - left < minW || bottom - top < minH) return outer

  return { top, bottom, left, right }
}

export function boundsToCrop(bounds: Bounds, imgW: number, imgH: number, scale: number): {
  sx: number
  sy: number
  sw: number
  sh: number
} {
  const inv = 1 / scale
  const sx = Math.max(0, Math.round(bounds.left * inv))
  const sy = Math.max(0, Math.round(bounds.top * inv))
  const sw = Math.min(imgW - sx, Math.round((bounds.right - bounds.left) * inv))
  const sh = Math.min(imgH - sy, Math.round((bounds.bottom - bounds.top) * inv))
  return { sx, sy, sw, sh }
}

export function boundsToQuad(bounds: Bounds): [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }] {
  const { top, bottom, left, right } = bounds
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ]
}
