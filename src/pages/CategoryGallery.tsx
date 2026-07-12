import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getCategory } from '../data/categories'
import { formatPrice } from '../data/tariffs'
import CategoryGalleryScene, { getThemeForCategory } from '../components/Gallery3D/CategoryGalleryScene'
import Joystick from '../components/Joystick'
import { initKeyboardInput, addLookDelta } from '../gallery/input'
import type { Artwork, CategoryId } from '../types'
import './CategoryGallery.css'

export default function CategoryGallery() {
  const { category } = useParams<{ category: string }>()
  const cat = getCategory(category as CategoryId)
  const artworks = useStore((s) => s.getCategoryWorks(category ?? ''))
  const [selected, setSelected] = useState<Artwork | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const cleanup = initKeyboardInput()
    return cleanup
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!cat) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Категория не найдена</p>
        <Link to="/galleries">← К галереям</Link>
      </div>
    )
  }

  const theme = getThemeForCategory(cat.id)

  return (
    <div className="cat-gallery">
      <CategoryGalleryScene artworks={artworks} theme={theme} onSelect={setSelected} />

      <div className="cat-gallery__hud">
        <div className="cat-gallery__title">
          <Link to="/galleries" className="cat-gallery__back">←</Link>
          <span>{cat.icon} {cat.name}</span>
        </div>

        <div className="gallery-crosshair" />

        <div className="cat-gallery__hint">
          {isMobile ? 'Джойстик — движение · Свайп — обзор' : 'WASD — движение · Мышь — обзор'}
        </div>

        {selected && (
          <div className="cat-gallery__info card">
            <img src={selected.imageUrl} alt={selected.title} />
            <div>
              <h3>{selected.title}</h3>
              <p className="cat-gallery__price">{formatPrice(selected.price)}</p>
              <Link to={`/artwork/${selected.id}`} className="btn btn-primary">Карточка лота</Link>
            </div>
          </div>
        )}
      </div>

      {isMobile && <Joystick onLook={addLookDelta} />}
    </div>
  )
}
