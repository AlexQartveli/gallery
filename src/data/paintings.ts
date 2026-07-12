export interface Painting {
  id: string
  title: string
  artist: string
  description: string
  price: number
  width: number
  height: number
  imageUrl: string
  status: 'available' | 'sold' | 'reserved'
  createdAt: string
}

const ARTISTS = [
  'Анна Волкова',
  'Михаил Орлов',
  'Елена Соколова',
  'Дмитрий Козлов',
  'София Морозова',
  'Игорь Лебедев',
  'Мария Новикова',
  'Артём Зайцев',
]

const TITLES = [
  'Утренний туман',
  'Золотой закат',
  'Тихая гавань',
  'Городские огни',
  'Лесная тропа',
  'Морской бриз',
  'Осенний парк',
  'Снежная вершина',
  'Лунная ночь',
  'Весенний сад',
  'Портрет мечты',
  'Абстракция №7',
  'Голубые холмы',
  'Красная роза',
  'Безмолвие',
  'Свет и тень',
  'Дождливый день',
  'Старая мельница',
  'Поле маков',
  'Горный ручей',
  'Ночной Париж',
  'Белые облака',
  'Тёплый вечер',
  'Холодное утро',
]

const DESCRIPTIONS = [
  'Масло на холсте, написано в импрессионистской манере.',
  'Акрил, современная интерпретация пейзажа.',
  'Классическая композиция с тонкой проработкой деталей.',
  'Экспрессивная работа с яркими цветовыми акцентами.',
  'Спокойная палитра, идеально для интерьера.',
  'Авторская техника, уникальная фактура поверхности.',
]

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function generatePaintings(count: number): Painting[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const width = 60 + Math.floor(seededRandom(seed) * 80)
    const height = 50 + Math.floor(seededRandom(seed + 100) * 100)
    const price = 5000 + Math.floor(seededRandom(seed + 200) * 95000)

    return {
      id: `painting-${i + 1}`,
      title: TITLES[i % TITLES.length],
      artist: ARTISTS[Math.floor(seededRandom(seed + 300) * ARTISTS.length)],
      description: DESCRIPTIONS[Math.floor(seededRandom(seed + 400) * DESCRIPTIONS.length)],
      price,
      width,
      height,
      imageUrl: `https://picsum.photos/seed/artvault${i + 1}/600/800`,
      status: seededRandom(seed + 500) > 0.92 ? 'sold' : 'available',
      createdAt: new Date(Date.now() - Math.floor(seededRandom(seed + 600) * 30) * 86400000).toISOString(),
    }
  })
}

export const PAINTINGS = generatePaintings(24)

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)
}
