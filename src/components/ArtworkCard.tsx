import type { KeyboardEvent, MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getCategory } from '../data/categories'
import { formatPrice } from '../data/tariffs'
import { isBoostActive } from '../data/boosts'
import ArtworkMedia from './ArtworkMedia'
import type { Artwork } from '../types'
import './ArtworkCard.css'

interface ArtworkCardProps {
  artwork: Artwork
  compact?: boolean
}

export default function ArtworkCard({ artwork, compact }: ArtworkCardProps) {
  const artists = useStore((s) => s.artists)
  const artist = artists.find((item) => item.id === artwork.artistId)
  const cat = getCategory(artwork.category)
  const navigate = useNavigate()

  const hasCrown = isBoostActive(artwork.vipBoosts?.crown)
  const hasSpotlight = isBoostActive(artwork.vipBoosts?.spotlight)
  const hasCatalog = isBoostActive(artwork.vipBoosts?.catalog)
  const isSold = artwork.status === 'sold'
  const sizeLabel = artwork.depth
    ? `${artwork.width}×${artwork.height}×${artwork.depth} см`
    : `${artwork.width}×${artwork.height} см`

  const openArtist = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (artist) navigate(`/artist/${artist.id}`)
  }

  return (
    <Link to={`/artwork/${artwork.id}`} className={`artwork-card card ${compact ? 'artwork-card--compact' : ''} ${isSold ? 'artwork-card--sold' : ''}`}>
      <ArtworkMedia
        wrapClassName="artwork-card__image-wrap"
        src={artwork.imageUrl}
        alt={artwork.seoAlt || artwork.title}
        loading="lazy"
      >
        {isSold && <div className="artwork-card__sold-overlay">Продано</div>}

        <div className="artwork-card__badges">
          {cat && <span className="artwork-card__cat">{cat.icon} {cat.name}</span>}
          <div className="artwork-card__vip">
            {hasCrown && <span className="artwork-card__crown" title="Корона VIP">👑</span>}
            {hasSpotlight && <span className="artwork-card__spotlight" title="Прожектор">💡</span>}
            {(hasCatalog || artwork.featured) && <span className="artwork-card__featured">VIP</span>}
          </div>
        </div>

        {!isSold && <span className="badge badge-available artwork-card__status">В продаже</span>}
      </ArtworkMedia>

      <div className="artwork-card__body">
        <div className="artwork-card__top">
          <h3 className="artwork-card__title">{artwork.title}</h3>
          <p className="artwork-card__price">{formatPrice(artwork.price)}</p>
        </div>

        {artist && (
          <button type="button" className="artwork-card__artist" onClick={openArtist}>
            <img src={artist.avatar} alt="" className="artwork-card__artist-avatar" />
            <span>
              <strong>{artist.name}</strong>
              <small>{artist.city}</small>
            </span>
          </button>
        )}

        {!compact && <p className="artwork-card__desc">{artwork.description}</p>}

        <div className="artwork-card__meta">
          <span>{sizeLabel}</span>
          {artwork.aiScore && <span>Фото {artwork.aiScore}/10</span>}
        </div>
      </div>
    </Link>
  )
}
