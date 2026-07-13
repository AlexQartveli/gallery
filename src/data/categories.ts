import type { Category, CategoryId } from '../types'

export const CATEGORIES: Category[] = [
  {
    id: 'painting',
    name: 'Картины',
    icon: '🖼️',
    description: 'Живопись: масло, акрил, акварель — зал «Классика и реализм»',
    galleryTheme: 'classic_realism',
    examples: ['Пейзажи', 'Портреты', 'Абстракция'],
  },
  {
    id: 'sculpture',
    name: 'Скульптуры',
    icon: '🗿',
    description: 'Объёмные работы в неоклассическом музейном коридоре',
    galleryTheme: 'classic_realism',
    examples: ['Бюсты', 'Абстрактные формы', 'Миниатюры'],
  },
  {
    id: 'photography',
    name: 'Фотография',
    icon: '📷',
    description: 'Художественная фотография — зал «Белый куб»',
    galleryTheme: 'white_cube',
    examples: ['Пейзаж', 'Портрет', 'Урбан'],
  },
  {
    id: 'graphics',
    name: 'Графика',
    icon: '✏️',
    description: 'Рисунки и иллюстрации в светлой экспозиции White Cube',
    galleryTheme: 'white_cube',
    examples: ['Эскизы', 'Постеры', 'Иллюстрации'],
  },
  {
    id: 'digital',
    name: 'Цифровое искусство',
    icon: '💻',
    description: 'NFT и digital art — киберпанк-галерея с неоновой подсветкой',
    galleryTheme: 'digital_nft',
    examples: ['Концепт-арт', 'Generative', '3D-арт'],
  },
  {
    id: 'ceramics',
    name: 'Керамика',
    icon: '🏺',
    description: 'Керамика и фарфор — индустриальный лофт с бетоном и неоном',
    galleryTheme: 'industrial_loft',
    examples: ['Вазы', 'Скульптурная керамика', 'Посуда'],
  },
  {
    id: 'textile',
    name: 'Текстиль и ремёсла',
    icon: '🧵',
    description: 'Гобелены и текстиль — бруталистский коридор с трековым светом',
    galleryTheme: 'industrial_loft',
    examples: ['Гобелены', 'Вышивка', 'Войлок'],
  },
]

export function getCategory(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)
}
