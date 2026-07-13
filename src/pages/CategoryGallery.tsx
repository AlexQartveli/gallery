import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getCategory } from '../data/categories'
import { formatPrice } from '../data/tariffs'
import CategoryGalleryScene, { getThemeForCategory, getThemeLabel } from '../components/Gallery3D/CategoryGalleryScene'
import GalleryFallback from '../components/GalleryFallback'
import ErrorBoundary from '../components/ErrorBoundary'
import Joystick from '../components/Joystick'
import PageLoader from '../components/PageLoader'
import { initKeyboardInput, addLookDelta } from '../gallery/input'
import { isWebGLAvailable } from '../lib/webgl'
import type { Artwork, CategoryId } from '../types'
import './CategoryGallery.css'

export default function CategoryGallery() {
  const { category } = useParams<{ category: string }>()
  const cat = getCategory(category as CategoryId)
  const allArtworks = useStore((s) => s.artworks)
  const artists = useStore((s) => s.artists)
  const artworks = useMemo(
    () =>
      allArtworks
        .filter((artwork) => artwork.category === (category ?? '') && artwork.status === 'active')
        .sort((a, b) => {
          const aVip = a.vipBoosts?.catalog ? 1 : 0
          const bVip = b.vipBoosts?.catalog ? 1 : 0
          if (aVip !== bVip) return bVip - aVip
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        }),
    [allArtworks, category]
  )
  const [selected, setSelected] = useState<Artwork | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [use3d, setUse3d] = useState<boolean | null>(null)

  const selectedArtist = selected ? artists.find((artist) => artist.id === selected.artistId) : undefined

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

  useEffect(() => {
    setUse3d(isWebGLAvailable())
  }, [])

  if (!cat) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Категория не найдена</p>
        <Link to="/galleries">← К галереям</Link>
      </div>
    )
  }

  if (use3d === null) {
    return <PageLoader label="Подготовка галереи…" />
  }

  if (!use3d) {
    return (
      <GalleryFallback
        categoryName={cat.name}
        categoryIcon={cat.icon}
        artworks={artworks}
      />
    )
  }

  const theme = getThemeForCategory(cat.id)
  const themeLabel = getThemeLabel(theme)

  return (
    <div className="cat-gallery">
      <ErrorBoundary
        onError={() => setUse3d(false)}
        fallback={
          <GalleryFallback
            categoryName={cat.name}
            categoryIcon={cat.icon}
            artworks={artworks}
          />
        }
      >
        <CategoryGalleryScene
          artworks={artworks}
          theme={theme}
          selectedId={selected?.id}
          onSelect={setSelected}
          onFatalError={() => setUse3d(false)}
        />
      </ErrorBoundary>

      <div className="cat-gallery__vignette" />
      <div className="cat-gallery__grain" />

      <div className="cat-gallery__hud">
        <div className="cat-gallery__topbar">
          <div className="cat-gallery__topbar-main">
            <Link to="/galleries" className="cat-gallery__back" aria-label="К галереям">←</Link>
            <div className="cat-gallery__title-wrap">
              <p className="cat-gallery__eyebrow">{themeLabel}</p>
              <h1 className="cat-gallery__title">{cat.icon} {cat.name}</h1>
            </div>
          </div>
          <div className="cat-gallery__stats">
            <div className="cat-gallery__stat">
              <strong>{artworks.length}</strong>
              <span>экспонатов</span>
            </div>
            <div className="cat-gallery__stat">
              <strong>{Math.min(artworks.length, 10)}</strong>
              <span>в зале</span>
            </div>
          </div>
        </div>

        <div className="gallery-crosshair" aria-hidden="true">
          <span className="gallery-crosshair__dot" />
        </div>

        <div className="cat-gallery__bottombar cat-gallery__hint">
          {isMobile ? (
            <>
              <span>◎</span>
              Джойстик — движение
              <span>↔</span>
              Свайп — обзор
            </>
          ) : (
            <>
              <span>W</span>
              WASD — движение
              <span>◎</span>
              Мышь — обзор
            </>
          )}
        </div>

        {selected && (
          <aside className="cat-gallery__info card">
            <div className="cat-gallery__info-media">
              <img src={selected.imageUrl} alt={selected.title} />
              <span className="cat-gallery__info-badge">Вы смотрите</span>
            </div>
            <div className="cat-gallery__info-body">
              <h3>{selected.title}</h3>
              {selectedArtist && (
                <Link to={`/artist/${selectedArtist.id}`} className="cat-gallery__artist">
                  <img src={selectedArtist.avatar} alt="" />
                  <span>
                    <strong>{selectedArtist.name}</strong>
                    <small>{selectedArtist.city}</small>
                  </span>
                </Link>
              )}
              <p className="cat-gallery__price">{formatPrice(selected.price)}</p>
              <Link to={`/artwork/${selected.id}`} className="btn btn-primary">Открыть карточку лота</Link>
            </div>
          </aside>
        )}
      </div>

      {isMobile && <Joystick onLook={addLookDelta} />}
    </div>
  )
}
