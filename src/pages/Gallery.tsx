import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatPrice } from '../data/paintings'
import type { Painting } from '../data/paintings'
import GalleryScene from '../components/Gallery3D/GalleryScene'
import Joystick from '../components/Joystick'
import { initKeyboardInput, addLookDelta } from '../gallery/input'
import './Gallery.css'

export default function Gallery() {
  const paintings = useStore((s) => s.paintings)
  const [selected, setSelected] = useState<Painting | null>(null)
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

  return (
    <div className="gallery-page">
      <GalleryScene paintings={paintings} onSelect={setSelected} />

      <div className="gallery-hud">
        <div className="gallery-hud__hint">
          {isMobile ? (
            <span>Джойстик — движение · Правая часть экрана — обзор</span>
          ) : (
            <span>WASD — движение · Мышь — обзор · Клик — захват курсора</span>
          )}
        </div>

        <div className="gallery-crosshair" />

        {selected && (
          <div className="gallery-info card">
            <img src={selected.imageUrl} alt={selected.title} />
            <div className="gallery-info__body">
              <h3>{selected.title}</h3>
              <p className="gallery-info__artist">{selected.artist}</p>
              <p className="gallery-info__price">{formatPrice(selected.price)}</p>
              <Link to={`/painting/${selected.id}`} className="btn btn-primary gallery-info__btn">
                Подробнее
              </Link>
            </div>
          </div>
        )}
      </div>

      {isMobile && <Joystick onLook={addLookDelta} />}
    </div>
  )
}
