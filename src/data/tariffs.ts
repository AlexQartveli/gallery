import type { Tariff } from '../types'

export const TARIFFS: Tariff[] = [
  {
    id: 'starter',
    name: 'Старт',
    price: 299,
    periodDays: 30,
    maxListings: 1,
    features: [
      '1 лот на 30 дней',
      'Размещение в каталоге',
      'Базовая 3D-галерея',
      'Карточка автора',
    ],
    aiAnalysis: false,
    featured: false,
  },
  {
    id: 'artist',
    name: 'Художник',
    price: 990,
    periodDays: 90,
    maxListings: 5,
    features: [
      '5 лотов на 90 дней',
      'AI-анализ фото (Gemini)',
      'Все категории',
      'Профиль автора с портфолио',
      'Приоритет в каталоге',
    ],
    aiAnalysis: true,
    featured: false,
    popular: true,
  },
  {
    id: 'studio',
    name: 'Студия',
    price: 2490,
    periodDays: 180,
    maxListings: 20,
    features: [
      '20 лотов на 180 дней',
      'AI-анализ + автозаполнение',
      'Выделение в галерее',
      'Расширенная карточка автора',
      'Статистика просмотров',
    ],
    aiAnalysis: true,
    featured: true,
  },
  {
    id: 'gallery',
    name: 'Галерея',
    price: 4990,
    periodDays: 365,
    maxListings: 999,
    features: [
      'Безлимит лотов на год',
      'VIP-место в 3D-галерее',
      'Все AI-инструменты',
      'Персональная витрина автора',
      'Приоритетная поддержка',
    ],
    aiAnalysis: true,
    featured: true,
  },
]

export function getTariff(id: string) {
  return TARIFFS.find((t) => t.id === id)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)
}
