import { Link } from 'react-router-dom'
import { formatPrice } from '../data/tariffs'
import ArtworkMedia from '../components/ArtworkMedia'
import type { Artwork } from '../types'
import './GalleryFallback.css'

interface Props {
  categoryName: string
  categoryIcon: string
  artworks: Artwork[]
}

export default function GalleryFallback({ categoryName, categoryIcon, artworks }: Props) {
  return (
    <div className="gallery-fallback">
      <div className="gallery-fallback__head">
        <Link to="/galleries" className="gallery-fallback__back">← К галереям</Link>
        <h1>{categoryIcon} {categoryName}</h1>
        <p>3D-режим недоступен на этом устройстве — показан каталог работ в зале.</p>
      </div>

      {artworks.length === 0 ? (
        <p className="gallery-fallback__empty">В этой категории пока нет работ.</p>
      ) : (
        <div className="gallery-fallback__grid">
          {artworks.map((artwork) => (
            <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="gallery-fallback__card card">
              <ArtworkMedia wrapClassName="gallery-fallback__media" src={artwork.imageUrl} alt={artwork.title} loading="lazy" />
              <div>
                <h3>{artwork.title}</h3>
                <p>{formatPrice(artwork.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
