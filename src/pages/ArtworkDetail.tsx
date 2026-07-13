import { Link, useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getCategory } from '../data/categories'
import { formatPrice } from '../data/tariffs'
import ArtworkCard from '../components/ArtworkCard'
import './ArtworkDetail.css'

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>()
  const artwork = useStore((s) => s.getArtwork(id ?? ''))
  const artist = useStore((s) => s.getArtist(artwork?.artistId ?? ''))
  const artworks = useStore((s) => s.artworks)
  const related = artworks
    .filter((work) => work.artistId === (artwork?.artistId ?? '') && work.status !== 'draft' && work.id !== id)
    .slice(0, 3)
  const navigate = useNavigate()

  if (!artwork) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Лот не найден</p>
        <Link to="/board">← К каталогу</Link>
      </div>
    )
  }

  const cat = getCategory(artwork.category)

  return (
    <div className="artwork-detail">
      <div className="container">
        <button className="btn btn-ghost artwork-detail__back" onClick={() => navigate(-1)}>← Назад</button>

        <div className="artwork-detail__grid">
          <div className="artwork-detail__image card">
            <img src={artwork.imageUrl} alt={artwork.title} />
            {artwork.aiScore && (
              <div className="artwork-detail__ai">
                Качество фото: {artwork.aiScore}/10
              </div>
            )}
          </div>

          <div className="artwork-detail__info">
            <div className="artwork-detail__tags">
              <span className="artwork-detail__cat">{cat?.icon} {cat?.name}</span>
              <span className={`badge ${artwork.status === 'active' ? 'badge-available' : 'badge-sold'}`}>
                {artwork.status === 'active' ? 'В продаже' : 'Продано'}
              </span>
            </div>
            <h1>{artwork.title}</h1>
            {artist && (
              <Link to={`/artist/${artist.id}`} className="artwork-detail__artist">
                <img src={artist.avatar} alt="" />
                {artist.name} · {artist.city}
              </Link>
            )}
            <p className="artwork-detail__price">{formatPrice(artwork.price)}</p>
            <p className="artwork-detail__desc">{artwork.description}</p>

            <dl className="artwork-detail__meta">
              <div><dt>Размер</dt><dd>{artwork.width} × {artwork.height}{artwork.depth ? ` × ${artwork.depth}` : ''} см</dd></div>
              <div><dt>Размещено</dt><dd>{new Date(artwork.createdAt).toLocaleDateString('ru-RU')}</dd></div>
              <div><dt>Активно до</dt><dd>{new Date(artwork.expiresAt).toLocaleDateString('ru-RU')}</dd></div>
            </dl>

            {artwork.status === 'active' ? (
              <>
                <Link to={`/checkout/${artwork.id}`} className="btn btn-primary artwork-detail__buy">Купить</Link>
                <Link to={`/promote/${artwork.id}`} className="btn btn-secondary artwork-detail__promote">👑 VIP-размещение</Link>
              </>
            ) : (
              <p className="artwork-detail__sold">Эта работа уже продана</p>
            )}

            {cat && (
              <Link to={`/gallery/${cat.id}`} className="btn btn-secondary artwork-detail__gallery">
                Смотреть в 3D-галерее
              </Link>
            )}
          </div>
        </div>

        {related.length > 0 && artist && (
          <section className="artwork-detail__related">
            <h2>Другие работы {artist.name}</h2>
            <div className="artwork-detail__related-grid">
              {related.map((w) => <ArtworkCard key={w.id} artwork={w} compact />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
