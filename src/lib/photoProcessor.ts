import type { ProcessedPhoto } from '../types'
import {
  detectPerspectiveQuad,
  estimateQuadSkew,
  scaleQuad,
  warpQuadToCanvas,
  type Point,
} from './perspective'
import {
  boundsToCrop,
  detectBackgroundBounds,
  detectPaintingBounds,
} from './segment'
import { drawArtworkWatermark } from './watermark'

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

type ExtractMethod = 'perspective' | 'rect' | 'none'

interface ExtractResult {
  canvas: HTMLCanvasElement
  method: ExtractMethod
  cropped: boolean
  quad?: Point[]
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

function createAnalysis(img: ImageBitmap) {
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
  return { data, w, h, scale }
}

function segmentPaintingBounds(data: Uint8ClampedArray, w: number, h: number) {
  const outer = detectBackgroundBounds(data, w, h)
  return detectPaintingBounds(data, w, h, outer)
}

function cropCanvas(src: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = sw
  out.height = sh
  const ctx = out.getContext('2d')!
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh)
  return out
}

function refineCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, w, h).data
  const bounds = segmentPaintingBounds(data, w, h)
  if (bounds.top <= 2 && bounds.left <= 2 && bounds.right >= w - 2 && bounds.bottom >= h - 2) {
    return canvas
  }
  return cropCanvas(canvas, bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top)
}

function detectNativeFrameCrop(img: ImageBitmap): CropRect {
  const { data, w, h, scale } = createAnalysis(img)
  const bounds = segmentPaintingBounds(data, w, h)
  return boundsToCrop(bounds, img.width, img.height, scale)
}

function extractPainting(img: ImageBitmap): ExtractResult {
  const { data, w, h, scale } = createAnalysis(img)

  const perspQuad = detectPerspectiveQuad(data, w, h)
  if (perspQuad && estimateQuadSkew(perspQuad) > 0.02) {
    const fullQuad = scaleQuad(perspQuad, scale)
    const warped = warpQuadToCanvas(img, fullQuad)
    if (warped) {
      const refined = refineCanvas(warped)
      return {
        canvas: refined,
        method: 'perspective',
        cropped: true,
        quad: fullQuad,
      }
    }
  }

  const bounds = segmentPaintingBounds(data, w, h)
  const crop = boundsToCrop(bounds, img.width, img.height, scale)
  const cropped = crop.sw < img.width * 0.97 || crop.sh < img.height * 0.97

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const result = cropCanvas(canvas, crop.sx, crop.sy, crop.sw, crop.sh)

  return {
    canvas: result,
    method: cropped ? 'rect' : 'none',
    cropped,
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

async function processImageFromExtracted(extracted: ExtractResult, category?: string): Promise<ProcessedPhoto> {
  const artW = extracted.canvas.width
  const artH = extracted.canvas.height

  const estFrame = frameWidth(MAX_WIDTH, MAX_HEIGHT)
  const estMat = matWidth(MAX_WIDTH, MAX_HEIGHT)
  const pad = 2 * (estFrame + estMat)
  const { width, height } = fitDimensions(artW, artH, MAX_WIDTH - pad, MAX_HEIGHT - pad)

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
  ctx.drawImage(extracted.canvas, offset, offset, width, height)
  drawArtworkWatermark(ctx, offset, offset, width, height)

  const { image, mime } = canvasToWebp(canvas)
  const sizeKb = Math.round((image.length * 0.75) / 1024)

  const tips =
    extracted.method === 'perspective'
      ? ['Полотно выбрано целиком, перспектива выровнена, пропорции сохранены']
      : extracted.cropped
        ? ['Полотно выбрано целиком, фон и старая рамка убраны, пропорции сохранены']
        : ['Полотно оставлено целиком в исходных пропорциях']

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
  extractMethod?: ExtractMethod
  artwork?: {
    width: number
    height: number
  }
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

  const start = performance.now()
  const extracted = extractPainting(img)
  const result = await processImageFromExtracted(extracted, category)

  return {
    result,
    durationMs: Math.round(performance.now() - start),
    original,
    crop: { ...cropRect, cropped: extracted.cropped },
    extractMethod: extracted.method,
    artwork: {
      width: extracted.canvas.width,
      height: extracted.canvas.height,
    },
  }
}

export { PHOTO_PROCESS_PRICE }
