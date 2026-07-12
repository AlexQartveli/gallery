import type { Artist, Artwork } from '../types'

export const SEED_ARTISTS: Artist[] = [
  {
    id: 'artist-1',
    name: 'Анна Волкова',
    bio: 'Живописец, работаю в технике масло и акрил. Участница выставок в Москве и Санкт-Петербурге.',
    city: 'Москва',
    avatar: 'https://picsum.photos/seed/artist1/200/200',
    website: 'https://example.com',
    tariffId: 'studio',
    joinedAt: '2025-03-15T00:00:00Z',
    featured: true,
  },
  {
    id: 'artist-2',
    name: 'Михаил Орлов',
    bio: 'Скульптор, мастерская в центре Казани. Бронза, глина, камень.',
    city: 'Казань',
    avatar: 'https://picsum.photos/seed/artist2/200/200',
    tariffId: 'artist',
    joinedAt: '2025-06-01T00:00:00Z',
    featured: true,
  },
  {
    id: 'artist-3',
    name: 'Елена Соколова',
    bio: 'Фотограф. Снимаю городские пейзажи и портреты на плёнку и цифру.',
    city: 'Санкт-Петербург',
    avatar: 'https://picsum.photos/seed/artist3/200/200',
    tariffId: 'gallery',
    joinedAt: '2024-11-20T00:00:00Z',
    featured: true,
  },
  {
    id: 'artist-4',
    name: 'Дмитрий Козлов',
    bio: 'Цифровой художник, концепт-арт для игр и кино.',
    city: 'Новосибирск',
    avatar: 'https://picsum.photos/seed/artist4/200/200',
    tariffId: 'artist',
    joinedAt: '2025-09-10T00:00:00Z',
    featured: false,
  },
  {
    id: 'artist-5',
    name: 'София Морозова',
    bio: 'Керамист. Авторские вазы и скульптурная керамика ручной работы.',
    city: 'Екатеринбург',
    avatar: 'https://picsum.photos/seed/artist5/200/200',
    tariffId: 'starter',
    joinedAt: '2026-01-05T00:00:00Z',
    featured: false,
  },
  {
    id: 'artist-6',
    name: 'Игорь Лебедев',
    bio: 'График и иллюстратор. Линогравюра, офорт, авторские постеры.',
    city: 'Владимир',
    avatar: 'https://picsum.photos/seed/artist6/200/200',
    tariffId: 'studio',
    joinedAt: '2025-07-22T00:00:00Z',
    featured: false,
  },
]

const TITLES: Record<string, string[]> = {
  painting: ['Утренний туман', 'Золотой закат', 'Тихая гавань', 'Лесная тропа', 'Лунная ночь'],
  sculpture: ['Мыслитель', 'Птица ветра', 'Абстракция №3', 'Дуэт', 'Форма времени'],
  photography: ['Городской рассвет', 'Туман над Невой', 'Портрет в окне', 'Ночной переулок', 'Отражение'],
  graphics: ['Линии города', 'Эскиз №12', 'Осенний лист', 'Портрет карандашом', 'Композиция'],
  digital: ['Неоновый сон', 'Киберпейзаж', 'Глитч-портрет', 'Метавселенная', 'Data flow'],
  ceramics: ['Ваза «Волна»', 'Кувшин утра', 'Скульптура «Земля»', 'Чашка весны', 'Амфора'],
  textile: ['Гобелен «Лес»', 'Вышитый портрет', 'Войлочная птица', 'Панно «Море»', 'Ковёр-сон'],
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function generateSeedArtworks(): Artwork[] {
  const categories = Object.keys(TITLES) as Artwork['category'][]
  const artworks: Artwork[] = []
  let idx = 0

  for (const cat of categories) {
    const titles = TITLES[cat]
    for (let i = 0; i < 4; i++) {
      idx++
      const seed = idx
      const artist = SEED_ARTISTS[Math.floor(seededRandom(seed) * SEED_ARTISTS.length)]
      const price = 150 + Math.floor(seededRandom(seed + 50) * 4350)
      const daysAgo = Math.floor(seededRandom(seed + 100) * 60)

      artworks.push({
        id: `artwork-${idx}`,
        title: titles[i % titles.length],
        artistId: artist.id,
        category: cat,
        description: `Авторская работа в категории «${cat}». Уникальный экспонат для коллекции.`,
        price,
        width: 30 + Math.floor(seededRandom(seed + 200) * 100),
        height: 30 + Math.floor(seededRandom(seed + 300) * 120),
        depth: cat === 'sculpture' || cat === 'ceramics' ? 15 + Math.floor(seededRandom(seed + 400) * 40) : undefined,
        imageUrl: `https://picsum.photos/seed/geogallery${idx}/800/1000`,
        status: seededRandom(seed + 500) > 0.9 ? 'sold' : 'active',
        createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + (90 - daysAgo) * 86400000).toISOString(),
        featured: seededRandom(seed + 600) > 0.75,
        aiScore: 7 + Math.floor(seededRandom(seed + 700) * 3),
      })
    }
  }

  return artworks
}

export const SEED_ARTWORKS = generateSeedArtworks()
