export interface Point {
  x: number
  y: number
}

interface EdgePoint extends Point {
  nx: number
  ny: number
}

interface Line {
  a: number
  b: number
  c: number
}

function sobel(data: Uint8ClampedArray, w: number, x: number, y: number) {
  const at = (dx: number, dy: number) => {
    const i = ((y + dy) * w + (x + dx)) * 4
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const gx =
    -at(-1, -1) + at(1, -1) +
    -2 * at(-1, 0) + 2 * at(1, 0) +
    -at(-1, 1) + at(1, 1)
  const gy =
    -at(-1, -1) - 2 * at(0, -1) - at(1, -1) +
    at(-1, 1) + 2 * at(0, 1) + at(1, 1)
  const mag = Math.hypot(gx, gy)
  return { gx, gy, mag }
}

function collectEdges(data: Uint8ClampedArray, w: number, h: number): EdgePoint[] {
  const mags: number[] = []
  for (let y = 2; y < h - 2; y += 3) {
    for (let x = 2; x < w - 2; x += 3) {
      mags.push(sobel(data, w, x, y).mag)
    }
  }
  mags.sort((a, b) => a - b)
  const threshold = mags[Math.floor(mags.length * 0.78)] ?? 20

  const pts: EdgePoint[] = []
  for (let y = 2; y < h - 2; y += 2) {
    for (let x = 2; x < w - 2; x += 2) {
      const { gx, gy, mag } = sobel(data, w, x, y)
      if (mag < threshold) continue
      const dist = Math.hypot(x - w / 2, y - h / 2)
      if (dist < Math.min(w, h) * 0.18) continue
      pts.push({ x, y, nx: gx / mag, ny: gy / mag })
    }
  }
  return pts
}

function fitLine(points: Point[]): Line | null {
  if (points.length < 8) return null
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  const mx = sx / points.length
  const my = sy / points.length
  let cxx = 0
  let cxy = 0
  let cyy = 0
  for (const p of points) {
    const dx = p.x - mx
    const dy = p.y - my
    cxx += dx * dx
    cxy += dx * dy
    cyy += dy * dy
  }
  const theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy)
  const a = Math.sin(theta)
  const b = -Math.cos(theta)
  const c = -(a * mx + b * my)
  const norm = Math.hypot(a, b) || 1
  return { a: a / norm, b: b / norm, c: c / norm }
}

function bucketEdges(pts: EdgePoint[], w: number, h: number): { top: EdgePoint[]; bottom: EdgePoint[]; left: EdgePoint[]; right: EdgePoint[] } {
  const top: EdgePoint[] = []
  const bottom: EdgePoint[] = []
  const left: EdgePoint[] = []
  const right: EdgePoint[] = []
  const cx = w / 2
  const cy = h / 2

  for (const p of pts) {
    if (p.y < cy && p.ny > 0.3) top.push(p)
    else if (p.y > cy && p.ny < -0.3) bottom.push(p)
    else if (p.x < cx && p.nx > 0.3) left.push(p)
    else if (p.x > cx && p.nx < -0.3) right.push(p)
  }

  return { top, bottom, left, right }
}

function intersect(l1: Line, l2: Line): Point | null {
  const det = l1.a * l2.b - l2.a * l1.b
  if (Math.abs(det) < 1e-6) return null
  return {
    x: (l1.b * l2.c - l2.b * l1.c) / det,
    y: (l2.a * l1.c - l1.a * l2.c) / det,
  }
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function quadArea(quad: Point[]): number {
  let sum = 0
  for (let i = 0; i < 4; i++) {
    const p = quad[i]
    const q = quad[(i + 1) % 4]
    sum += p.x * q.y - q.x * p.y
  }
  return Math.abs(sum) / 2
}

function isConvex(quad: Point[]): boolean {
  let sign = 0
  for (let i = 0; i < 4; i++) {
    const a = quad[i]
    const b = quad[(i + 1) % 4]
    const c = quad[(i + 2) % 4]
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (Math.abs(cross) < 1) continue
    if (sign === 0) sign = cross > 0 ? 1 : -1
    else if ((cross > 0 ? 1 : -1) !== sign) return false
  }
  return true
}

export function detectPerspectiveQuad(data: Uint8ClampedArray, w: number, h: number): Point[] | null {
  const edges = collectEdges(data, w, h)
  if (edges.length < 40) return null

  const { top, bottom, left, right } = bucketEdges(edges, w, h)
  const lineTop = fitLine(top)
  const lineBottom = fitLine(bottom)
  const lineLeft = fitLine(left)
  const lineRight = fitLine(right)

  if (!lineTop || !lineBottom || !lineLeft || !lineRight) return null

  const tl = intersect(lineTop, lineLeft)
  const tr = intersect(lineTop, lineRight)
  const br = intersect(lineBottom, lineRight)
  const bl = intersect(lineBottom, lineLeft)
  if (!tl || !tr || !br || !bl) return null

  const quad = [tl, tr, br, bl]
  const pad = Math.min(w, h) * 0.02
  for (const p of quad) {
    if (p.x < -pad || p.y < -pad || p.x > w + pad || p.y > h + pad) return null
  }

  const area = quadArea(quad)
  if (area < w * h * 0.2 || area > w * h * 0.98) return null
  if (!isConvex(quad)) return null

  const topW = dist(tl, tr)
  const bottomW = dist(bl, br)
  const leftH = dist(tl, bl)
  const rightH = dist(tr, br)
  const ratio1 = topW / Math.max(bottomW, 1)
  const ratio2 = leftH / Math.max(rightH, 1)
  if (ratio1 < 0.55 || ratio1 > 1.8 || ratio2 < 0.55 || ratio2 > 1.8) return null

  return quad
}

function solveLinearSystem(matrix: number[][], values: number[]): number[] | null {
  const n = values.length
  const a = matrix.map((row) => [...row])
  const b = [...values]

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row
    }
    if (Math.abs(a[pivot][col]) < 1e-10) return null
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    ;[b[col], b[pivot]] = [b[pivot], b[col]]

    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col] / a[col][col]
      for (let j = col; j < n; j++) a[row][j] -= factor * a[col][j]
      b[row] -= factor * b[col]
    }
  }

  const x = new Array(n).fill(0)
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row]
    for (let col = row + 1; col < n; col++) sum -= a[row][col] * x[col]
    x[row] = sum / a[row][row]
  }
  return x
}

function homographyFromQuad(dst: Point[], src: Point[]): number[] | null {
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x: xp, y: yp } = dst[i]
    const { x, y } = src[i]
    A.push([xp, yp, 1, 0, 0, 0, -x * xp, -x * yp])
    b.push(x)
    A.push([0, 0, 0, xp, yp, 1, -y * xp, -y * yp])
    b.push(y)
  }
  const h = solveLinearSystem(A, b)
  if (!h) return null
  return [...h, 1]
}

function applyHomography(H: number[], x: number, y: number): Point {
  const w = H[6] * x + H[7] * y + H[8]
  return {
    x: (H[0] * x + H[1] * y + H[2]) / w,
    y: (H[3] * x + H[4] * y + H[5]) / w,
  }
}

function sampleBilinear(data: Uint8ClampedArray, w: number, h: number, x: number, y: number): [number, number, number, number] {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) return [0, 0, 0, 255]

  const tx = x - x0
  const ty = y - y0
  const i = (px: number, py: number) => (py * w + px) * 4

  const c00 = i(x0, y0)
  const c10 = i(x0 + 1, y0)
  const c01 = i(x0, y0 + 1)
  const c11 = i(x0 + 1, y0 + 1)

  const out = [0, 0, 0, 0]
  for (let k = 0; k < 4; k++) {
    const v =
      data[c00 + k] * (1 - tx) * (1 - ty) +
      data[c10 + k] * tx * (1 - ty) +
      data[c01 + k] * (1 - tx) * ty +
      data[c11 + k] * tx * ty
    out[k] = Math.round(v)
  }
  return out as [number, number, number, number]
}

export function warpQuadToCanvas(img: ImageBitmap, quad: Point[]): HTMLCanvasElement | null {
  const topW = dist(quad[0], quad[1])
  const bottomW = dist(quad[3], quad[2])
  const leftH = dist(quad[0], quad[3])
  const rightH = dist(quad[1], quad[2])
  const outW = Math.max(1, Math.round((topW + bottomW) / 2))
  const outH = Math.max(1, Math.round((leftH + rightH) / 2))

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = img.width
  srcCanvas.height = img.height
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, img.width, img.height).data

  const H = homographyFromQuad(
    [
      { x: 0, y: 0 },
      { x: outW, y: 0 },
      { x: outW, y: outH },
      { x: 0, y: outH },
    ],
    quad,
  )
  if (!H) return null

  const dstCanvas = document.createElement('canvas')
  dstCanvas.width = outW
  dstCanvas.height = outH
  const dstCtx = dstCanvas.getContext('2d')!
  const imageData = dstCtx.createImageData(outW, outH)

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const src = applyHomography(H, x, y)
      const rgba = sampleBilinear(srcData, img.width, img.height, src.x, src.y)
      const i = (y * outW + x) * 4
      imageData.data[i] = rgba[0]
      imageData.data[i + 1] = rgba[1]
      imageData.data[i + 2] = rgba[2]
      imageData.data[i + 3] = rgba[3]
    }
  }

  dstCtx.putImageData(imageData, 0, 0)
  return dstCanvas
}

export function scaleQuad(quad: Point[], scale: number): Point[] {
  return quad.map((p) => ({ x: p.x / scale, y: p.y / scale }))
}

export function estimateQuadSkew(quad: Point[]): number {
  const topW = dist(quad[0], quad[1])
  const bottomW = dist(quad[3], quad[2])
  const leftH = dist(quad[0], quad[3])
  const rightH = dist(quad[1], quad[2])
  return Math.max(
    Math.abs(topW - bottomW) / Math.max(topW, bottomW),
    Math.abs(leftH - rightH) / Math.max(leftH, rightH),
  )
}
