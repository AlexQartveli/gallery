import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/categories'
import { useStore } from '../store/useStore'
import './Galleries.css'

export default function Galleries() {
  const artworks = useStore((s) => s.artworks)

  return (
    <div className="galleries-page">
      <div className="container">
        <header className="galleries-page__header">
          <h1>3D Галереи</h1>
          <p>Четыре премиальных виртуальных коридора для разных направлений искусства. WASD + мышь на ПК, джойстик на мобильных.</p>
        </header>
        <div className="galleries-page__grid">
          {CATEGORIES.map((cat) => {
            const count = artworks.filter((a) => a.category === cat.id && a.status === 'active').length
            return (
              <Link key={cat.id} to={`/gallery/${cat.id}`} className="gallery-card card">
                <div className="gallery-card__preview" data-theme={cat.galleryTheme}>
                  <span className="gallery-card__icon">{cat.icon}</span>
                </div>
                <div className="gallery-card__body">
                  <h2>{cat.name}</h2>
                  <p>{cat.description}</p>
                  <div className="gallery-card__meta">
                    <span>{count} экспонатов</span>
                    <span className="gallery-card__enter">Войти →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
