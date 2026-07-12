import type { PhotoAnalysis, ProcessedPhoto } from '../types'

const AI_PHOTO_PRICE = 5

async function clientOptimize(file: File, category?: string): Promise<ProcessedPhoto> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = await createImageBitmap(file)

  const targetW = 800
  const targetH = 1000
  const targetRatio = targetW / targetH
  const srcRatio = img.width / img.height

  let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height
  if (srcRatio > targetRatio) {
    cropW = img.height * targetRatio
    cropX = (img.width - cropW) / 2
  } else {
    cropH = img.width / targetRatio
    cropY = (img.height - cropH) / 2
  }

  canvas.width = targetW
  canvas.height = targetH
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH)

  const image = canvas.toDataURL('image/jpeg', 0.82)
  const sizeKb = Math.round((image.length * 0.75) / 1024)

  return {
    image,
    mime: 'image/jpeg',
    width: targetW,
    height: targetH,
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

export async function analyzePhoto(imageBase64: string, category?: string): Promise<PhotoAnalysis> {
  try {
    const res = await fetch('/api/analyze.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, category }),
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data as PhotoAnalysis
  } catch {
    return { score: 7, ready: true, issues: [], tips: ['Снимайте при дневном свете'] }
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

export { AI_PHOTO_PRICE }
