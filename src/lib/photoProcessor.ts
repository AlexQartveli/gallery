import type { ProcessedPhoto } from '../types'

const PHOTO_PROCESS_PRICE = 5
const MAX_WIDTH = 800
const MAX_HEIGHT = 1000
const WEBP_QUALITY = 0.82

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

async function clientOptimize(file: File, category?: string): Promise<ProcessedPhoto> {
  const img = await createImageBitmap(file)

  const estFrame = frameWidth(MAX_WIDTH, MAX_HEIGHT)
  const estMat = matWidth(MAX_WIDTH, MAX_HEIGHT)
  const pad = 2 * (estFrame + estMat)
  const { width, height } = fitDimensions(img.width, img.height, MAX_WIDTH - pad, MAX_HEIGHT - pad)

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
  ctx.drawImage(img, offset, offset, width, height)

  const { image, mime } = canvasToWebp(canvas)
  const sizeKb = Math.round((image.length * 0.75) / 1024)

  return {
    image,
    mime,
    width: totalW,
    height: totalH,
    sizeKb,
    score: 7,
    ready: true,
    issues: [],
    tips: ['Локальная оптимизация (сервер недоступен)'],
    seoTitle: 'Авторская работа',
    seoDescription: 'Уникальное произведение искусства на Geo Gallery',
    seoAlt: 'Произведение искусства — Geo Gallery',
    suggestedCategory: category,
  }
}

export async function processPhoto(file: File, category?: string): Promise<ProcessedPhoto> {
  const base64 = await fileToBase64(file)

  try {
    const res = await fetch('/api/process-photo.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, category }),
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data as ProcessedPhoto
  } catch {
    return clientOptimize(file, category)
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export { PHOTO_PROCESS_PRICE }
