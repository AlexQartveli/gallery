import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import PaintingCard from '../components/PaintingCard'
import './Home.css'

export default function Home() {
  const paintings = useStore((s) => s.paintings)
  const featured = paintings.filter((p) => p.status === 'available').slice(0, 6)

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__eyebrow">Маркетплейс искусства</p>
            <h1 className="hero__title">
              Покупайте картины.<br />
              <em>Гуляйте по галерее.</em>
            </h1>
            <p className="hero__desc">
              ArtVault — доска объявлений, где художники выставляют свои работы.
              Мы принимаем оплату, выкупаем картину у автора и доставляем вам домой.
            </p>
            <div className="hero__actions">
              <Link to="/gallery" className="btn btn-primary">Войти в 3D галерею</Link>
              <Link to="/board" className="btn btn-secondary">Смотреть объявления</Link>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__frame">
              <img src="https://picsum.photos/seed/hero-art/500/650" alt="Картина" />
            </div>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>
          <div className="how__grid">
            <div className="how__step">
              <span className="how__num">01</span>
              <h3>Художник размещает работу</h3>
              <p>Автор публикует картину на доске объявлений с ценой и описанием.</p>
            </div>
            <div className="how__step">
              <span className="how__num">02</span>
              <h3>Покупатель выбирает</h3>
              <p>Гуляйте по 3D-галерее или просматривайте объявления в каталоге.</p>
            </div>
            <div className="how__step">
              <span className="how__num">03</span>
              <h3>ArtVault выкупает</h3>
              <p>Вы оплачиваете на сайте — мы выкупаем картину у художника.</p>
            </div>
            <div className="how__step">
              <span className="how__num">04</span>
              <h3>Доставка покупателю</h3>
              <p>Мы бережно упаковываем и отправляем картину по вашему адресу.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="featured">
        <div className="container">
          <div className="featured__header">
            <h2 className="section-title">Избранные работы</h2>
            <Link to="/board" className="btn btn-ghost">Все объявления →</Link>
          </div>
          <div className="featured__grid">
            {featured.map((p) => (
              <PaintingCard key={p.id} id={p.id} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
