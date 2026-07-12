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

function smooth(profile: Float32Array, radius: number): Float32Array {
  const out = new Float32Array(profile.length)
  for (let i = 0; i < profile.length; i++) {
    let sum = 0
    let n = 0
    for (let j = Math.max(0, i - radius); j <= Math.min(profile.length - 1, i + radius); j++) {
      sum += profile[j]
      n++
    }
    out[i] = sum / n
  }
  return out
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))
  return sorted[idx]
}

function detectHorizontalEdge(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  x1: number,
  fromTop: boolean,
  minEdge: number,
): { pos: number; confidence: number } {
  const votes: number[] = []
  const yStart = fromTop ? 2 : h - 3
  const yEnd = fromTop ? Math.floor(h * 0.44) : Math.floor(h * 0.56)
  const yStep = fromTop ? 1 : -1

  for (let x = x0; x < x1; x += 2) {
    let bestY = fromTop ? 0 : h
    let bestE = 0
    for (let y = yStart; fromTop ? y < yEnd : y > yEnd; y += yStep) {
      const i1 = (y * w + x) * 4
      const i2 = ((y + (fromTop ? 1 : -1)) * w + x) * 4
      const e = Math.abs(lum(data, i2) - lum(data, i1))
      if (e > bestE) {
        bestE = e
        bestY = y
      }
    }
    if (bestE >= minEdge) votes.push(bestY + (fromTop ? 3 : -3))
  }

  if (votes.length < (x1 - x0) * 0.12) {
    return { pos: fromTop ? 0 : h, confidence: 0 }
  }

  const pos = Math.round(percentile(votes, 0.58))
  const spread = percentile(votes, 0.9) - percentile(votes, 0.1)
  const confidence = spread <= h * 0.06 ? 1 : spread <= h * 0.12 ? 0.7 : 0.4
  return { pos, confidence }
}

function detectVerticalEdge(
  data: Uint8ClampedArray,
  w: number,
  y0: number,
  y1: number,
  fromLeft: boolean,
  minEdge: number,
): { pos: number; confidence: number } {
  const votes: number[] = []
  const xStart = fromLeft ? 2 : w - 3
  const xEnd = fromLeft ? Math.floor(w * 0.44) : Math.floor(w * 0.56)
  const xStep = fromLeft ? 1 : -1

  for (let y = y0; y < y1; y += 2) {
    let bestX = fromLeft ? 0 : w
    let bestE = 0
    for (let x = xStart; fromLeft ? x < xEnd : x > xEnd; x += xStep) {
      const i1 = (y * w + x) * 4
      const i2 = (y * w + x + (fromLeft ? 1 : -1)) * 4
      const e = Math.abs(lum(data, i2) - lum(data, i1))
      if (e > bestE) {
        bestE = e
        bestX = x
      }
    }
    if (bestE >= minEdge) votes.push(bestX + (fromLeft ? 3 : -3))
  }

  if (votes.length < (y1 - y0) * 0.12) {
    return { pos: fromLeft ? 0 : w, confidence: 0 }
  }

  const pos = Math.round(percentile(votes, 0.58))
  const spread = percentile(votes, 0.9) - percentile(votes, 0.1)
  const confidence = spread <= w * 0.06 ? 1 : spread <= w * 0.12 ? 0.7 : 0.4
  return { pos, confidence }
}

function alignPair(
  a: { pos: number; confidence: number },
  b: { pos: number; confidence: number },
  size: number,
): { start: number; end: number } {
  const marginA = a.pos
  const marginB = size - b.pos

  if (a.confidence === 0 && b.confidence === 0) return { start: 0, end: size }
  if (a.confidence === 0) return { start: size - marginB, end: marginB }
  if (b.confidence === 0) return { start: marginA, end: size - marginA }

  const diff = Math.abs(marginA - marginB)
  const avg = Math.round((marginA + marginB) / 2)
  const maxM = Math.max(marginA, marginB, 1)

  if (diff / maxM <= 0.22) return { start: avg, end: size - avg }
  if (a.confidence >= b.confidence) return { start: marginA, end: size - marginA }
  return { start: marginB, end: size - marginB }
}

function detectBounds(data: Uint8ClampedArray, w: number, h: number) {
  const x0 = Math.floor(w * 0.12)
  const x1 = Math.floor(w * 0.88)
  const y0 = Math.floor(h * 0.12)
  const y1 = Math.floor(h * 0.88)

  const edgeProfile = new Float32Array(h)
  for (let y = 1; y < h - 1; y++) {
    edgeProfile[y] = rowEdge(data, w, y, x0, x1)
  }
  const smoothed = smooth(edgeProfile, 3)
  const refEdge = Math.max(median([...smoothed].filter((v) => v > 0)), 3) * 2.2
  const minEdge = refEdge * 0.85

  const topEdge = detectHorizontalEdge(data, w, h, x0, x1, true, minEdge)
  const bottomEdge = detectHorizontalEdge(data, w, h, x0, x1, false, minEdge)
  const leftEdge = detectVerticalEdge(data, w, y0, y1, true, minEdge)
  const rightEdge = detectVerticalEdge(data, w, y0, y1, false, minEdge)

  const vertical = alignPair(topEdge, bottomEdge, h)
  const horizontal = alignPair(leftEdge, rightEdge, w)

  return {
    top: vertical.start,
    bottom: vertical.end,
    left: horizontal.start,
    right: horizontal.end,
  }
}

function detectNativeFrameCrop(img: ImageBitmap): CropRect {
  const maxAnalyze = 960
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
