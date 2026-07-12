import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import { TARIFFS, formatPrice } from '../data/tariffs'
import ArtworkCard from '../components/ArtworkCard'
import ArtistCard from '../components/ArtistCard'
import './Home.css'

export default function Home() {
  const artworks = useStore((s) => s.artworks)
  const artists = useStore((s) => s.artists)
  const featured = artworks.filter((a) => a.featured && a.status === 'active').slice(0, 6)
  const featuredArtists = artists.filter((a) => a.featured).slice(0, 3)

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__eyebrow">Маркетплейс искусства</p>
            <h1 className="hero__title">
              Geo Gallery<br />
              <em>искусство рядом с вами</em>
            </h1>
            <p className="hero__desc">
              Размещайте картины, скульптуры, фотографию и другие работы.
              Гуляйте по 3D-галереям, покупайте — мы выкупим у автора и доставим вам.
            </p>
            <div className="hero__actions">
              <Link to="/galleries" className="btn btn-primary">3D Галереи</Link>
              <Link to="/pricing" className="btn btn-secondary">Тарифы размещения</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="categories">
        <div className="container">
          <h2 className="section-title">Категории</h2>
          <div className="categories__grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} to={`/gallery/${cat.id}`} className="category-card card">
                <span className="category-card__icon">{cat.icon}</span>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
                <span className="category-card__link">Войти в галерею →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>
          <div className="how__grid">
            <div className="how__step"><span className="how__num">01</span><h3>Выберите тариф</h3><p>Оплатите размещение — от 15 ₾/мес</p></div>
            <div className="how__step"><span className="how__num">02</span><h3>Загрузите работу</h3><p>AI Gemini проверит качество фото</p></div>
            <div className="how__step"><span className="how__num">03</span><h3>Попадите в галерею</h3><p>Отдельная 3D-галерея для каждой категории</p></div>
            <div className="how__step"><span className="how__num">04</span><h3>Продажа</h3><p>Geo Gallery выкупает и доставляет покупателю</p></div>
          </div>
        </div>
      </section>

      <section className="featured">
        <div className="container">
          <div className="featured__header">
            <h2 className="section-title">Избранные лоты</h2>
            <Link to="/board" className="btn btn-ghost">Весь каталог →</Link>
          </div>
          <div className="featured__grid">
            {featured.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
          </div>
        </div>
      </section>

      <section className="artists-section">
        <div className="container">
          <div className="featured__header">
            <h2 className="section-title">Авторы</h2>
            <Link to="/artists" className="btn btn-ghost">Все авторы →</Link>
          </div>
          <div className="artists-section__grid">
            {featuredArtists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </div>
      </section>

      <section className="pricing-preview">
        <div className="container">
          <h2 className="section-title">Тарифы размещения</h2>
          <div className="pricing-preview__grid">
            {TARIFFS.map((t) => (
              <div key={t.id} className="pricing-preview__item card">
                <h3>{t.name}</h3>
                <p className="pricing-preview__price">{formatPrice(t.price)}</p>
                <p className="pricing-preview__period">{t.periodDays} дней · {t.maxListings >= 999 ? '∞' : t.maxListings} лотов</p>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="btn btn-primary pricing-preview__cta">Выбрать тариф</Link>
        </div>
      </section>
    </div>
  )
}
