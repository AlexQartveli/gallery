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

function estimateBackgroundFromEdges(data: Uint8ClampedArray, w: number, h: number): Rgb {
  const samples: Rgb[] = []
  const step = Math.max(2, Math.round(Math.min(w, h) / 180))

  for (let x = 0; x < w; x += step) {
    samples.push(sampleRgb(data, w, x, 0), sampleRgb(data, w, x, h - 1))
  }
  for (let y = 0; y < h; y += step) {
    samples.push(sampleRgb(data, w, 0, y), sampleRgb(data, w, w - 1, y))
  }

  return {
    r: median(samples.map((s) => s.r)),
    g: median(samples.map((s) => s.g)),
    b: median(samples.map((s) => s.b)),
  }
}

function estimateBackground(data: Uint8ClampedArray, w: number, h: number): Rgb {
  const edge = estimateBackgroundFromEdges(data, w, h)
  const corner = estimateBackgroundCorners(data, w, h)
  return {
    r: median([edge.r, corner.r]),
    g: median([edge.g, corner.g]),
    b: median([edge.b, corner.b]),
  }
}

function estimateBackgroundCorners(data: Uint8ClampedArray, w: number, h: number): Rgb {
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

function intersectBounds(a: Bounds, b: Bounds): Bounds | null {
  const top = Math.max(a.top, b.top)
  const bottom = Math.min(a.bottom, b.bottom)
  const left = Math.max(a.left, b.left)
  const right = Math.min(a.right, b.right)
  if (right - left < 8 || bottom - top < 8) return null
  return { top, bottom, left, right }
}

function boundsArea(bounds: Bounds): number {
  return Math.max(0, bounds.right - bounds.left) * Math.max(0, bounds.bottom - bounds.top)
}

export function detectForegroundBoundsFloodFill(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance = 46,
): Bounds {
  const bg = estimateBackgroundFromEdges(data, w, h)
  const visited = new Uint8Array(w * h)
  const queue: number[] = []

  const isBackground = (x: number, y: number) => colorDist(sampleRgb(data, w, x, y), bg) < tolerance

  const seed = (x: number, y: number) => {
    const idx = y * w + x
    if (visited[idx] || !isBackground(x, y)) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < w; x++) {
    seed(x, 0)
    seed(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    seed(0, y)
    seed(w - 1, y)
  }

  while (queue.length) {
    const idx = queue.pop()!
    const x = idx % w
    const y = Math.floor(idx / w)
    if (x > 0) seed(x - 1, y)
    if (x < w - 1) seed(x + 1, y)
    if (y > 0) seed(x, y - 1)
    if (y < h - 1) seed(x, y + 1)
  }

  let top = h
  let bottom = 0
  let left = w
  let right = 0
  let found = false

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[y * w + x]) continue
      found = true
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
      left = Math.min(left, x)
      right = Math.max(right, x)
    }
  }

  if (!found) return { top: 0, bottom: h, left: 0, right: w }

  const pad = Math.max(2, Math.round(Math.min(right - left, bottom - top) * 0.006))
  return {
    top: Math.max(0, top - pad),
    bottom: Math.min(h, bottom + pad + 1),
    left: Math.max(0, left - pad),
    right: Math.min(w, right + pad + 1),
  }
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
    if (rowBgRatio(data, w, y, bg, thresh, 0, w) < 0.72) {
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

  const flood = detectForegroundBoundsFloodFill(data, w, h)
  const merged = intersectBounds(
    { top, bottom, left, right },
    flood,
  )

  if (merged && boundsArea(merged) < w * h * 0.985) {
    return merged
  }

  if (boundsArea(flood) < w * h * 0.985) {
    return flood
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

function isMatLike(c: Rgb): boolean {
  const max = Math.max(c.r, c.g, c.b)
  const min = Math.min(c.r, c.g, c.b)
  return c.r > 168 && c.g > 160 && c.b > 135 && max - min < 72
}

function isNearWhite(c: Rgb): boolean {
  return c.r > 232 && c.g > 228 && c.b > 218
}

function isWoodLike(c: Rgb): boolean {
  return c.r > 70 && c.g > 45 && c.b < 110 && c.r > c.b + 12 && c.r - c.g < 55
}

function luminance(c: Rgb): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
}

function rowStats(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number) {
  const lums: number[] = []
  let matCount = 0
  let woodCount = 0
  let n = 0

  for (let x = x0; x < x1; x += 2) {
    const c = sampleRgb(data, w, x, y)
    lums.push(luminance(c))
    if (isMatLike(c) || isNearWhite(c)) matCount++
    if (isWoodLike(c)) woodCount++
    n++
  }

  const mean = lums.reduce((sum, value) => sum + value, 0) / Math.max(1, lums.length)
  const variance = lums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, lums.length)

  return {
    matRatio: matCount / Math.max(1, n),
    woodRatio: woodCount / Math.max(1, n),
    variance,
  }
}

function colStats(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number) {
  const lums: number[] = []
  let matCount = 0
  let woodCount = 0
  let n = 0

  for (let y = y0; y < y1; y += 2) {
    const c = sampleRgb(data, w, x, y)
    lums.push(luminance(c))
    if (isMatLike(c) || isNearWhite(c)) matCount++
    if (isWoodLike(c)) woodCount++
    n++
  }

  const mean = lums.reduce((sum, value) => sum + value, 0) / Math.max(1, lums.length)
  const variance = lums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, lums.length)

  return {
    matRatio: matCount / Math.max(1, n),
    woodRatio: woodCount / Math.max(1, n),
    variance,
  }
}

function isMarginRow(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number): boolean {
  const stats = rowStats(data, w, y, x0, x1)
  return stats.matRatio > 0.58 || stats.woodRatio > 0.5 || stats.variance < 22
}

function isMarginCol(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number): boolean {
  const stats = colStats(data, w, x, y0, y1)
  return stats.matRatio > 0.58 || stats.woodRatio > 0.5 || stats.variance < 22
}

export function detectContentBounds(
  data: Uint8ClampedArray,
  w: number,
  _h: number,
  outer: Bounds,
): Bounds {
  const x0 = outer.left
  const x1 = outer.right
  const y0 = outer.top
  const y1 = outer.bottom

  let top = y0
  for (let y = y0; y < y1; y++) {
    if (!isMarginRow(data, w, y, x0, x1)) {
      top = y
      break
    }
  }

  let bottom = y1
  for (let y = y1 - 1; y >= top; y--) {
    if (!isMarginRow(data, w, y, x0, x1)) {
      bottom = y + 1
      break
    }
  }

  let left = x0
  for (let x = x0; x < x1; x++) {
    if (!isMarginCol(data, w, x, top, bottom)) {
      left = x
      break
    }
  }

  let right = x1
  for (let x = x1 - 1; x >= left; x--) {
    if (!isMarginCol(data, w, x, top, bottom)) {
      right = x + 1
      break
    }
  }

  const outerW = outer.right - outer.left
  const outerH = outer.bottom - outer.top
  const contentW = right - left
  const contentH = bottom - top

  if (contentW < outerW * 0.28 || contentH < outerH * 0.28) {
    return outer
  }

  const pad = Math.max(1, Math.round(Math.min(contentW, contentH) * 0.004))
  return {
    top: Math.max(outer.top, top - pad),
    bottom: Math.min(outer.bottom, bottom + pad),
    left: Math.max(outer.left, left - pad),
    right: Math.min(outer.right, right + pad),
  }
}

function tightenBounds(...candidates: Bounds[]): Bounds {
  if (candidates.length === 0) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  const top = Math.max(...candidates.map((b) => b.top))
  const left = Math.max(...candidates.map((b) => b.left))
  const bottom = Math.min(...candidates.map((b) => b.bottom))
  const right = Math.min(...candidates.map((b) => b.right))

  if (right <= left || bottom <= top) {
    return candidates[0]
  }

  return { top, bottom, left, right }
}

function horizontalMatRatio(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number): number {
  let count = 0
  let total = 0
  for (let x = x0; x < x1; x += 2) {
    if (isMatLike(sampleRgb(data, w, x, y))) count++
    total++
  }
  return total ? count / total : 0
}

function verticalMatRatio(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number): number {
  let count = 0
  let total = 0
  for (let y = y0; y < y1; y += 2) {
    if (isMatLike(sampleRgb(data, w, x, y))) count++
    total++
  }
  return total ? count / total : 0
}

function findMatInnerEdge(
  positions: number[],
  ratioAt: (position: number) => number,
): number | null {
  let seenMat = false
  let lowStreak = 0

  for (const position of positions) {
    const ratio = ratioAt(position)
    if (ratio > 0.48) {
      seenMat = true
      lowStreak = 0
      continue
    }
    if (seenMat && ratio < 0.24) {
      lowStreak++
      if (lowStreak >= 2) return position
    } else {
      lowStreak = 0
    }
  }
  return null
}

interface ContourCandidate {
  pos: number
  score: number
  margin: number
}

function contourCandidates(
  profile: Array<{ pos: number; score: number }>,
  outerEdge: number,
  direction: 1 | -1,
): ContourCandidate[] {
  if (profile.length < 3) return []
  const scores = profile.map((p) => p.score)
  const maxScore = Math.max(...scores)
  const baseline = median(scores)
  if (maxScore < 9 || maxScore < baseline * 1.2) return []

  const threshold = Math.max(maxScore * 0.48, baseline + 3)
  const candidates: ContourCandidate[] = []

  for (let i = 1; i < profile.length - 1; i++) {
    const item = profile[i]
    if (
      item.score >= threshold &&
      item.score >= profile[i - 1].score &&
      item.score >= profile[i + 1].score
    ) {
      candidates.push({
        ...item,
        margin: direction === 1 ? item.pos - outerEdge : outerEdge - item.pos,
      })
    }
  }

  return candidates
}

function choosePairedContours(
  startProfile: Array<{ pos: number; score: number }>,
  endProfile: Array<{ pos: number; score: number }>,
  outerStart: number,
  outerEnd: number,
): { start: number; end: number } {
  const starts = contourCandidates(startProfile, outerStart, 1)
  const ends = contourCandidates(endProfile, outerEnd, -1)
  if (!starts.length || !ends.length) return { start: outerStart, end: outerEnd }

  let best: { start: ContourCandidate; end: ContourCandidate; rank: number } | null = null

  for (const start of starts) {
    for (const end of ends) {
      const maxMargin = Math.max(start.margin, end.margin, 1)
      const mismatch = Math.abs(start.margin - end.margin) / maxMargin
      if (mismatch > 0.32) continue

      // Matching contours on opposite sides are frame boundaries. Prefer the
      // deepest matching pair; unrelated details inside a painting rarely
      // occur at the same distance from both opposite edges.
      const depth = (start.margin + end.margin) / 2
      const rank = depth * 2 + start.score + end.score - mismatch * 40
      if (!best || rank > best.rank) best = { start, end, rank }
    }
  }

  if (!best) return { start: outerStart, end: outerEnd }
  return { start: best.start.pos, end: best.end.pos }
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

  const topPositions = topProfile.map((item) => item.pos)
  const bottomPositions = [...bottomProfile].reverse().map((item) => item.pos)
  const leftPositions = leftProfile.map((item) => item.pos)
  const rightPositions = [...rightProfile].reverse().map((item) => item.pos)

  const matTop = findMatInnerEdge(topPositions, (y) => horizontalMatRatio(data, w, y, x0, x1))
  const matBottom = findMatInnerEdge(bottomPositions, (y) => horizontalMatRatio(data, w, y, x0, x1))
  const matLeft = findMatInnerEdge(leftPositions, (x) => verticalMatRatio(data, w, x, y0, y1))
  const matRight = findMatInnerEdge(rightPositions, (x) => verticalMatRatio(data, w, x, y0, y1))

  const vertical =
    matTop != null && matBottom != null
      ? { start: matTop, end: matBottom }
      : choosePairedContours(topProfile, bottomProfile, outer.top, outer.bottom)
  const horizontal =
    matLeft != null && matRight != null
      ? { start: matLeft, end: matRight }
      : choosePairedContours(leftProfile, rightProfile, outer.left, outer.right)

  let top = vertical.start
  let bottom = vertical.end
  let left = horizontal.start
  let right = horizontal.end

  const minW = outerW * 0.3
  const minH = outerH * 0.3
  if (right - left < minW || bottom - top < minH) {
    const content = detectContentBounds(data, w, h, outer)
    if (boundsArea(content) >= outerW * outerH * 0.12) {
      return content
    }
    return outer
  }

  // Keep a tiny safety margin outside the detected canvas. It is preferable
  // to retain one edge pixel from the old mat than to lose painted content.
  const safety = Math.max(1, Math.round(Math.min(right - left, bottom - top) * 0.002))
  top = Math.max(outer.top, top - safety)
  bottom = Math.min(outer.bottom, bottom + safety)
  left = Math.max(outer.left, left - safety)
  right = Math.min(outer.right, right + safety)

  if (right <= left || bottom <= top || w < 1 || h < 1) return outer

  const framed = { top, bottom, left, right }
  const content = detectContentBounds(data, w, h, framed)
  return tightenBounds(framed, content)
}

export function segmentArtworkBounds(data: Uint8ClampedArray, w: number, h: number): Bounds {
  const outer = detectBackgroundBounds(data, w, h)
  const painting = detectPaintingBounds(data, w, h, outer)
  const trimmed = trimUniformMargins(data, w, h)
  return tightenBounds(painting, trimmed)
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

export function trimUniformMargins(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance = 40,
): Bounds {
  const bg = estimateBackgroundFromEdges(data, w, h)

  const rowBgShare = (y: number) => {
    let bgCount = 0
    for (let x = 0; x < w; x += 2) {
      if (colorDist(sampleRgb(data, w, x, y), bg) < tolerance) bgCount++
    }
    return bgCount / Math.ceil(w / 2)
  }

  const colBgShare = (x: number) => {
    let bgCount = 0
    for (let y = 0; y < h; y += 2) {
      if (colorDist(sampleRgb(data, w, x, y), bg) < tolerance) bgCount++
    }
    return bgCount / Math.ceil(h / 2)
  }

  let top = 0
  for (let y = 0; y < h; y++) {
    if (rowBgShare(y) < 0.9) {
      top = y
      break
    }
  }

  let bottom = h
  for (let y = h - 1; y >= 0; y--) {
    if (rowBgShare(y) < 0.9) {
      bottom = y + 1
      break
    }
  }

  let left = 0
  for (let x = 0; x < w; x++) {
    if (colBgShare(x) < 0.9) {
      left = x
      break
    }
  }

  let right = w
  for (let x = w - 1; x >= 0; x--) {
    if (colBgShare(x) < 0.9) {
      right = x + 1
      break
    }
  }

  if (right - left < w * 0.25 || bottom - top < h * 0.25) {
    return { top: 0, bottom: h, left: 0, right: w }
  }

  return { top, bottom, left, right }
}
