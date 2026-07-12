import type { ProcessedPhoto } from '../types'

const PHOTO_PROCESS_PRICE = 5
const MAX_WIDTH = 800
const MAX_HEIGHT = 1000
const WEBP_QUALITY = 0.82

interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

function frameWidth(w: number, h: number): number {
  return Math.max(16, Math.round(Math.min(w, h) * 0.055))
}

function matWidth(w: number, h: number): number {
  return Math.max(6, Math.round(Math.min(w, h) * 0.015))
}

function fitDimensions(srcW: number, srcH: number, maxW: number, maxH: number): { width: number; height: number } {
  if (srcW <= maxW && srcH <= maxH) {
    return { width: srcW, height: srcH }
  }
  const scale = Math.min(maxW / srcW, maxH / srcH)
  return {
    width: Math.round(srcW * scale),
    height: Math.round(srcH * scale),
  }
}

function lum(data: Uint8ClampedArray, idx: number): number {
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function rowVariance(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number): number {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let x = x0; x < x1; x += 2) {
    const v = lum(data, (y * w + x) * 4)
    sum += v
    sumSq += v * v
    n++
  }
  if (!n) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

function rowEdge(data: Uint8ClampedArray, w: number, y: number, x0: number, x1: number): number {
  let g = 0
  let n = 0
  for (let x = x0; x < x1; x += 2) {
    const i1 = (y * w + x) * 4
    const i2 = ((y + 1) * w + x) * 4
    g += Math.abs(lum(data, i2) - lum(data, i1))
    n++
  }
  return n ? g / n : 0
}

function colVariance(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number): number {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = y0; y < y1; y += 2) {
    const v = lum(data, (y * w + x) * 4)
    sum += v
    sumSq += v * v
    n++
  }
  if (!n) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

function colEdge(data: Uint8ClampedArray, w: number, x: number, y0: number, y1: number): number {
  let g = 0
  let n = 0
  for (let y = y0; y < y1; y += 2) {
    const i1 = (y * w + x) * 4
    const i2 = (y * w + x + 1) * 4
    g += Math.abs(lum(data, i2) - lum(data, i1))
    n++
  }
  return n ? g / n : 0
}

function detectBounds(data: Uint8ClampedArray, w: number, h: number) {
  const x0 = Math.floor(w * 0.1)
  const x1 = Math.floor(w * 0.9)
  const y0 = Math.floor(h * 0.1)
  const y1 = Math.floor(h * 0.9)

  const centerVariances: number[] = []
  for (let y = Math.floor(h * 0.28); y < Math.floor(h * 0.72); y += 3) {
    centerVariances.push(rowVariance(data, w, y, x0, x1))
  }
  const refVar = Math.max(median(centerVariances), 80)

  const centerEdges: number[] = []
  for (let y = Math.floor(h * 0.28); y < Math.floor(h * 0.72); y += 3) {
    centerEdges.push(rowEdge(data, w, y, x0, x1))
  }
  const refEdge = Math.max(median(centerEdges), 2)

  let top = 0
  let bestTop = 0
  for (let y = 4; y < Math.floor(h * 0.4); y++) {
    const edge = rowEdge(data, w, y, x0, x1)
    const variance = rowVariance(data, w, y + 1, x0, x1)
    const score = edge / refEdge + variance / refVar
    if (edge > refEdge * 1.8 && variance > refVar * 0.45 && score > bestTop) {
      bestTop = score
      top = y + 2
    }
  }

  let bottom = h
  let bestBottom = 0
  for (let y = h - 5; y > Math.floor(h * 0.6); y--) {
    const edge = rowEdge(data, w, y - 1, x0, x1)
    const variance = rowVariance(data, w, y - 1, x0, x1)
    const score = edge / refEdge + variance / refVar
    if (edge > refEdge * 1.8 && variance > refVar * 0.45 && score > bestBottom) {
      bestBottom = score
      bottom = y - 2
    }
  }

  let left = 0
  let bestLeft = 0
  for (let x = 4; x < Math.floor(w * 0.4); x++) {
    const edge = colEdge(data, w, x, y0, y1)
    const variance = colVariance(data, w, x + 1, y0, y1)
    const score = edge / refEdge + variance / refVar
    if (edge > refEdge * 1.8 && variance > refVar * 0.45 && score > bestLeft) {
      bestLeft = score
      left = x + 2
    }
  }

  let right = w
  let bestRight = 0
  for (let x = w - 5; x > Math.floor(w * 0.6); x--) {
    const edge = colEdge(data, w, x - 1, y0, y1)
    const variance = colVariance(data, w, x - 1, y0, y1)
    const score = edge / refEdge + variance / refVar
    if (edge > refEdge * 1.8 && variance > refVar * 0.45 && score > bestRight) {
      bestRight = score
      right = x - 2
    }
  }

  return { top, bottom, left, right }
}

function detectNativeFrameCrop(img: ImageBitmap): CropRect {
  const maxAnalyze = 720
  const scale = Math.min(1, maxAnalyze / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  const { top, bottom, left, right } = detectBounds(data, w, h)

  const cropW = right - left
  const cropH = bottom - top
  const minW = w * 0.35
  const minH = h * 0.35
  const maxCropX = w * 0.38
  const maxCropY = h * 0.38

  const sidesDetected =
    (top > 4 ? 1 : 0) +
    (bottom < h - 4 ? 1 : 0) +
    (left > 4 ? 1 : 0) +
    (right < w - 4 ? 1 : 0)

  const valid =
    sidesDetected >= 2 &&
    cropW >= minW &&
    cropH >= minH &&
    top < maxCropY &&
    h - bottom < maxCropY &&
    left < maxCropX &&
    w - right < maxCropX

  if (!valid) {
    return { sx: 0, sy: 0, sw: img.width, sh: img.height }
  }

  const inv = 1 / scale
  return {
    sx: Math.max(0, Math.round(left * inv)),
    sy: Math.max(0, Math.round(top * inv)),
    sw: Math.min(img.width, Math.round(cropW * inv)),
    sh: Math.min(img.height, Math.round(cropH * inv)),
  }
}

function paintWoodRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean) {
  const grad = vertical
    ? ctx.createLinearGradient(x, y, x + w, y)
    : ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, '#2a1a10')
  grad.addColorStop(0.25, '#8b5a3c')
  grad.addColorStop(0.5, '#a67c52')
  grad.addColorStop(0.75, '#7a4f35')
  grad.addColorStop(1, '#3d2817')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  const step = vertical ? 8 : 6
  for (let i = y + 4; i < y + h; i += step) {
    ctx.beginPath()
    if (vertical) {
      ctx.moveTo(x + 2, i)
      ctx.lineTo(x + w - 2, i)
    } else {
      ctx.moveTo(x + 4, i)
      ctx.lineTo(x + w - 4, i)
    }
    ctx.stroke()
  }
}

function drawWoodenFrame(ctx: CanvasRenderingContext2D, imgW: number, imgH: number, mat: number, frame: number) {
  const totalW = imgW + 2 * (mat + frame)
  const totalH = imgH + 2 * (mat + frame)

  paintWoodRect(ctx, 0, 0, totalW, frame, false)
  paintWoodRect(ctx, 0, totalH - frame, totalW, frame, false)
  paintWoodRect(ctx, 0, frame, frame, totalH - 2 * frame, true)
  paintWoodRect(ctx, totalW - frame, frame, frame, totalH - 2 * frame, true)

  ctx.fillStyle = '#f4efe6'
  ctx.fillRect(frame, frame, totalW - 2 * frame, totalH - 2 * frame)

  ctx.strokeStyle = '#c8bfb0'
  ctx.lineWidth = 1
  ctx.strokeRect(frame + mat - 1, frame + mat - 1, imgW + 2, imgH + 2)
}

function canvasToWebp(canvas: HTMLCanvasElement): { image: string; mime: string } {
  const webp = canvas.toDataURL('image/webp', WEBP_QUALITY)
  if (webp.startsWith('data:image/webp')) {
    return { image: webp, mime: 'image/webp' }
  }
  const jpeg = canvas.toDataURL('image/jpeg', WEBP_QUALITY)
  return { image: jpeg, mime: 'image/jpeg' }
}

async function processImage(file: File, category?: string): Promise<ProcessedPhoto> {
  const img = await createImageBitmap(file)
  const crop = detectNativeFrameCrop(img)
  const cropped = crop.sw < img.width || crop.sh < img.height

  const estFrame = frameWidth(MAX_WIDTH, MAX_HEIGHT)
  const estMat = matWidth(MAX_WIDTH, MAX_HEIGHT)
  const pad = 2 * (estFrame + estMat)
  const { width, height } = fitDimensions(crop.sw, crop.sh, MAX_WIDTH - pad, MAX_HEIGHT - pad)

  const frame = frameWidth(width, height)
  const mat = matWidth(width, height)
  const offset = frame + mat
  const totalW = width + 2 * offset
  const totalH = height + 2 * offset

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  drawWoodenFrame(ctx, width, height, mat, frame)
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, offset, offset, width, height)

  const { image, mime } = canvasToWebp(canvas)
  const sizeKb = Math.round((image.length * 0.75) / 1024)

  const tips = cropped
    ? ['Родная рамка обрезана, добавлена рамка Geo Gallery']
    : ['Рамка Geo Gallery добавлена']

  return {
    image,
    mime,
    width: totalW,
    height: totalH,
    sizeKb,
    score: 7,
    ready: true,
    issues: [],
    tips,
    seoTitle: 'Авторская работа',
    seoDescription: 'Уникальное произведение искусства на Geo Gallery',
    seoAlt: 'Произведение искусства — Geo Gallery',
    suggestedCategory: category,
  }
}

export async function processPhoto(file: File, category?: string): Promise<ProcessedPhoto> {
  const { result } = await processPhotoDetailed(file, category)
  return result
}

export interface ProcessPhotoReport {
  result: ProcessedPhoto
  durationMs: number
  original: {
    name: string
    bytes: number
    type: string
    width: number
    height: number
  }
  crop?: CropRect & { cropped: boolean }
}

export async function processPhotoDetailed(file: File, category?: string): Promise<ProcessPhotoReport> {
  const img = await createImageBitmap(file)
  const original = {
    name: file.name,
    bytes: file.size,
    type: file.type,
    width: img.width,
    height: img.height,
  }

  const cropRect = detectNativeFrameCrop(img)
  const cropped = cropRect.sw < img.width || cropRect.sh < img.height

  const start = performance.now()
  const result = await processImage(file, category)

  return {
    result,
    durationMs: Math.round(performance.now() - start),
    original,
    crop: { ...cropRect, cropped },
  }
}

export { PHOTO_PROCESS_PRICE }
