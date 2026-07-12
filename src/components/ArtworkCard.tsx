import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getCategory } from '../data/categories'
import { formatPrice } from '../data/tariffs'
import { isBoostActive } from '../data/boosts'
import type { Artwork } from '../types'
import './ArtworkCard.css'

interface ArtworkCardProps {
  artwork: Artwork
  compact?: boolean
}

export default function ArtworkCard({ artwork, compact }: ArtworkCardProps) {
  const artist = useStore((s) => s.getArtist(artwork.artistId))
  const cat = getCategory(artwork.category)
  const navigate = useNavigate()

  const hasCrown = isBoostActive(artwork.vipBoosts?.crown)
  const hasCatalog = isBoostActive(artwork.vipBoosts?.catalog)

  return (
    <Link to={`/artwork/${artwork.id}`} className={`artwork-card card ${compact ? 'artwork-card--compact' : ''}`}>
      <div className="artwork-card__image-wrap">
        <img src={artwork.imageUrl} alt={artwork.seoAlt || artwork.title} loading="lazy" />
        <span className="artwork-card__cat">{cat?.icon} {cat?.name}</span>
        {hasCrown && <span className="artwork-card__crown">👑</span>}
        {(hasCatalog || artwork.featured) && <span className="artwork-card__featured">VIP</span>}
        <span className={`badge ${artwork.status === 'active' ? 'badge-available' : 'badge-sold'}`}>
          {artwork.status === 'active' ? 'В продаже' : artwork.status === 'sold' ? 'Продано' : artwork.status}
        </span>
      </div>
      <div className="artwork-card__body">
        <h3 className="artwork-card__title">{artwork.title}</h3>
        {artist && (
          <span
            role="link"
            tabIndex={0}
            className="artwork-card__artist"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/artist/${artist.id}`) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); navigate(`/artist/${artist.id}`) } }}
          >
            {artist.name}
          </span>
        )}
        {!compact && <p className="artwork-card__desc">{artwork.description}</p>}
        <p className="artwork-card__price">{formatPrice(artwork.price)}</p>
      </div>
    </Link>
  )
}
