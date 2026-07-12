import type { BoostProduct } from '../types'

export const BOOST_PRODUCTS: BoostProduct[] = [
  {
    id: 'ai_photo',
    name: 'Обработка фото',
    description: 'Обрезка родной рамки, наша деревянная рамка, WebP',
    price: 5,
    periodDays: 0,
    icon: '📷',
    features: [
      'Обрезка родной рамки с фото',
      'Деревянная рамка Geo Gallery',
      'Сжатие до 800×1000 px',
      'Конвертация в WebP',
    ],
    popular: true,
  },
  {
    id: 'crown',
    name: 'Корона VIP',
    description: 'Золотая корона над работой в 3D-галерее',
    price: 19,
    periodDays: 30,
    icon: '👑',
    features: [
      'Корона над картиной в 3D-зале',
      'Выделение среди экспонатов',
      '30 дней',
    ],
  },
  {
    id: 'spotlight',
    name: 'Прожектор',
    description: 'Световой прожектор на работу в виртуальной галерее',
    price: 29,
    periodDays: 30,
    icon: '💡',
    features: [
      'Прожектор в 3D-галерее',
      'Привлекает внимание посетителей',
      '30 дней',
    ],
  },
  {
    id: 'catalog',
    name: 'Топ каталога',
    description: 'Бейдж VIP и приоритет в каталоге',
    price: 15,
    periodDays: 14,
    icon: '⭐',
    features: [
      'Бейдж VIP на карточке',
      'Приоритет в списке каталога',
      '14 дней',
    ],
  },
  {
    id: 'pack',
    name: 'VIP Пакет',
    description: 'Все VIP-опции сразу — максимальная видимость',
    price: 49,
    periodDays: 30,
    icon: '🏆',
    features: [
      'Корона + прожектор + топ каталога',
      'Максимальная видимость',
      '30 дней',
      'Экономия 14 ₾',
    ],
    popular: true,
  },
]

export function getBoost(id: string) {
  return BOOST_PRODUCTS.find((b) => b.id === id)
}

export function isBoostActive(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

export function hasAnyVip(boosts?: { crown?: string; spotlight?: string; catalog?: string }): boolean {
  if (!boosts) return false
  return isBoostActive(boosts.crown) || isBoostActive(boosts.spotlight) || isBoostActive(boosts.catalog)
}
