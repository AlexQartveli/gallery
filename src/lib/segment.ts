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

function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))]
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

  const objectW = right - left
  const objectH = bottom - top
  if (objectW < w * 0.2 || objectH < h * 0.15 || objectW * objectH < w * h * 0.06) {
    return { top: 0, bottom: h, left: 0, right: w }
  }

  return { top, bottom, left, right }
}

function horizontalContourScore(
  data: Uint8ClampedArray,
  w: number,
  y: number,
  x0: number,
  x1: number,
): number {
  const values: number[] = []
  for (let x = x0; x < x1; x += 2) {
    values.push(colorDist(sampleRgb(data, w, x, y - 1), sampleRgb(data, w, x, y + 1)))
  }
  if (!values.length) return 0
  const strongShare = values.filter((v) => v > 18).length / values.length
  return percentile(values, 0.42) + percentile(values, 0.72) * 0.35 + strongShare * 12
}

function verticalContourScore(
  data: Uint8ClampedArray,
  w: number,
  x: number,
  y0: number,
  y1: number,
): number {
  const values: number[] = []
  for (let y = y0; y < y1; y += 2) {
    values.push(colorDist(sampleRgb(data, w, x - 1, y), sampleRgb(data, w, x + 1, y)))
  }
  if (!values.length) return 0
  const strongShare = values.filter((v) => v > 18).length / values.length
  return percentile(values, 0.42) + percentile(values, 0.72) * 0.35 + strongShare * 12
}

function chooseInnerContour(profile: Array<{ pos: number; score: number }>, direction: 1 | -1): number | null {
  if (!profile.length) return null
  const scores = profile.map((p) => p.score)
  const maxScore = Math.max(...scores)
  const baseline = median(scores)
  if (maxScore < 10 || maxScore < baseline * 1.25) return null

  const threshold = Math.max(maxScore * 0.52, baseline + 3.5)
  const candidates = profile.filter((p) => p.score >= threshold)
  if (!candidates.length) return null

  // A frame has several parallel contours. The deepest reliable contour is
  // the edge between the old frame/mat and the actual painted surface.
  return candidates.reduce((best, item) =>
    direction === 1
      ? (item.pos > best.pos ? item : best)
      : (item.pos < best.pos ? item : best),
  ).pos
}

function mirrorMissingSide(start: number | null, end: number | null, outerStart: number, outerEnd: number) {
  if (start == null && end == null) return { start: outerStart, end: outerEnd }
  if (start == null && end != null) {
    const margin = outerEnd - end
    return { start: outerStart + margin, end }
  }
  if (start != null && end == null) {
    const margin = start - outerStart
    return { start, end: outerEnd - margin }
  }
  return { start: start!, end: end! }
}

export function detectPaintingBounds(data: Uint8ClampedArray, w: number, h: number, outer: Bounds): Bounds {
  const outerW = outer.right - outer.left
  const outerH = outer.bottom - outer.top
  const x0 = Math.floor(outer.left + outerW * 0.12)
  const x1 = Math.floor(outer.right - outerW * 0.12)
  const y0 = Math.floor(outer.top + outerH * 0.12)
  const y1 = Math.floor(outer.bottom - outerH * 0.12)

  const minX = Math.max(outer.left + 2, Math.floor(outer.left + outerW * 0.012))
  const maxX = Math.min(outer.right - 2, Math.ceil(outer.left + outerW * 0.22))
  const minRightX = Math.max(outer.left + 2, Math.floor(outer.right - outerW * 0.22))
  const maxRightX = Math.min(outer.right - 2, Math.ceil(outer.right - outerW * 0.012))
  const minY = Math.max(outer.top + 2, Math.floor(outer.top + outerH * 0.012))
  const maxY = Math.min(outer.bottom - 2, Math.ceil(outer.top + outerH * 0.22))
  const minBottomY = Math.max(outer.top + 2, Math.floor(outer.bottom - outerH * 0.22))
  const maxBottomY = Math.min(outer.bottom - 2, Math.ceil(outer.bottom - outerH * 0.012))

  const topProfile: Array<{ pos: number; score: number }> = []
  const bottomProfile: Array<{ pos: number; score: number }> = []
  const leftProfile: Array<{ pos: number; score: number }> = []
  const rightProfile: Array<{ pos: number; score: number }> = []

  for (let y = minY; y <= maxY; y++) {
    topProfile.push({ pos: y, score: horizontalContourScore(data, w, y, x0, x1) })
  }
  for (let y = minBottomY; y <= maxBottomY; y++) {
    bottomProfile.push({ pos: y, score: horizontalContourScore(data, w, y, x0, x1) })
  }
  for (let x = minX; x <= maxX; x++) {
    leftProfile.push({ pos: x, score: verticalContourScore(data, w, x, y0, y1) })
  }
  for (let x = minRightX; x <= maxRightX; x++) {
    rightProfile.push({ pos: x, score: verticalContourScore(data, w, x, y0, y1) })
  }

  const vertical = mirrorMissingSide(
    chooseInnerContour(topProfile, 1),
    chooseInnerContour(bottomProfile, -1),
    outer.top,
    outer.bottom,
  )
  const horizontal = mirrorMissingSide(
    chooseInnerContour(leftProfile, 1),
    chooseInnerContour(rightProfile, -1),
    outer.left,
    outer.right,
  )

  let top = vertical.start
  let bottom = vertical.end
  let left = horizontal.start
  let right = horizontal.end

  const minW = outerW * 0.48
  const minH = outerH * 0.48
  if (right - left < minW || bottom - top < minH) return outer

  // Move a few pixels into the canvas so antialiased remnants of the old
  // frame cannot survive the resize.
  const inset = Math.max(2, Math.round(Math.min(right - left, bottom - top) * 0.006))
  top += inset
  bottom -= inset
  left += inset
  right -= inset

  if (right <= left || bottom <= top || w < 1 || h < 1) return outer
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
