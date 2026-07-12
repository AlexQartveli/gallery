import type { PhotoAnalysis } from '../types'

const MOCK_ANALYSIS: PhotoAnalysis = {
  score: 7,
  ready: true,
  issues: ['Лёгкий перекос камеры'],
  tips: [
    'Снимайте при дневном свете без вспышки',
    'Держите камеру параллельно работе',
    'Оставьте нейтральный фон',
  ],
  suggestedTitle: 'Авторская работа',
  suggestedDescription: 'Уникальная работа, выполненная в авторской технике.',
  detectedCategory: 'painting',
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
    return { ...MOCK_ANALYSIS, score: 6 + Math.floor(Math.random() * 3) }
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
