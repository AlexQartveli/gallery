import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getTariff } from '../data/tariffs'
import { getCategory } from '../data/categories'
import ArtworkCard from '../components/ArtworkCard'
import './ArtistProfile.css'

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>()
  const artist = useStore((s) => s.getArtist(id ?? ''))
  const works = useStore((s) => s.getArtistWorks(id ?? ''))
  const tariff = getTariff(artist?.tariffId ?? '')

  if (!artist) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Автор не найден</p>
        <Link to="/artists">← К авторам</Link>
      </div>
    )
  }

  const active = works.filter((w) => w.status === 'active')
  const sold = works.filter((w) => w.status === 'sold')

  return (
    <div className="artist-profile">
      <div className="container">
        <div className="artist-profile__hero card">
          <img src={artist.avatar} alt={artist.name} className="artist-profile__avatar" />
          <div className="artist-profile__info">
            <h1>{artist.name}</h1>
            <p className="artist-profile__city">{artist.city}</p>
            {tariff && <span className="artist-profile__tariff">Тариф: {tariff.name}</span>}
            <p className="artist-profile__bio">{artist.bio}</p>
            {artist.website && (
              <a href={artist.website} target="_blank" rel="noreferrer" className="artist-profile__web">
                {artist.website}
              </a>
            )}
            <p className="artist-profile__joined">
              На платформе с {new Date(artist.joinedAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div className="artist-profile__stats">
            <div><strong>{active.length}</strong><span>В продаже</span></div>
            <div><strong>{sold.length}</strong><span>Продано</span></div>
            <div><strong>{new Set(works.map((w) => w.category)).size}</strong><span>Категорий</span></div>
          </div>
        </div>

        {active.length > 0 && (
          <section className="artist-profile__section">
            <h2>Работы в продаже</h2>
            <div className="artist-profile__grid">
              {active.map((w) => <ArtworkCard key={w.id} artwork={w} />)}
            </div>
          </section>
        )}

        {sold.length > 0 && (
          <section className="artist-profile__section">
            <h2>Проданные работы</h2>
            <div className="artist-profile__grid">
              {sold.map((w) => <ArtworkCard key={w.id} artwork={w} compact />)}
            </div>
          </section>
        )}

        <section className="artist-profile__section">
          <h2>Категории</h2>
          <div className="artist-profile__cats">
            {[...new Set(works.map((w) => w.category))].map((catId) => {
              const cat = getCategory(catId)
              return cat ? (
                <Link key={catId} to={`/gallery/${catId}`} className="artist-profile__cat">
                  {cat.icon} {cat.name}
                </Link>
              ) : null
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
