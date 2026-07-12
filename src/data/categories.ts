import type { Category, CategoryId } from '../types'

export const CATEGORIES: Category[] = [
  {
    id: 'painting',
    name: 'Картины',
    icon: '🖼️',
    description: 'Живопись: масло, акрил, акварель, пастель',
    galleryTheme: 'classic',
    examples: ['Пейзажи', 'Портреты', 'Абстракция'],
  },
  {
    id: 'sculpture',
    name: 'Скульптуры',
    icon: '🗿',
    description: 'Объёмные работы: бронза, мрамор, глина, mixed media',
    galleryTheme: 'marble',
    examples: ['Бюсты', 'Абстрактные формы', 'Миниатюры'],
  },
  {
    id: 'photography',
    name: 'Фотография',
    icon: '📷',
    description: 'Художественная и авторская фотография',
    galleryTheme: 'modern',
    examples: ['Пейзаж', 'Портрет', 'Урбан'],
  },
  {
    id: 'graphics',
    name: 'Графика',
    icon: '✏️',
    description: 'Рисунки, иллюстрации, линогравюра, офорт',
    galleryTheme: 'minimal',
    examples: ['Эскизы', 'Постеры', 'Иллюстрации'],
  },
  {
    id: 'digital',
    name: 'Цифровое искусство',
    icon: '💻',
    description: 'NFT-ready digital art, 3D-рендер, generative',
    galleryTheme: 'neon',
    examples: ['Концепт-арт', 'Generative', '3D-арт'],
  },
  {
    id: 'ceramics',
    name: 'Керамика',
    icon: '🏺',
    description: 'Керамика, фарфор, гончарные изделия',
    galleryTheme: 'warm',
    examples: ['Вазы', 'Скульптурная керамика', 'Посуда'],
  },
  {
    id: 'textile',
    name: 'Текстиль и ремёсла',
    icon: '🧵',
    description: 'Гобелены, вышивка, войлок, авторский текстиль',
    galleryTheme: 'cozy',
    examples: ['Гобелены', 'Вышивка', 'Войлок'],
  },
]

export function getCategory(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)
}
