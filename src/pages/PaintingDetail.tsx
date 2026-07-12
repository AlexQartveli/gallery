import { Link, useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatPrice } from '../data/paintings'
import './PaintingDetail.css'

export default function PaintingDetail() {
  const { id } = useParams<{ id: string }>()
  const painting = useStore((s) => s.getPainting(id ?? ''))
  const navigate = useNavigate()

  if (!painting) {
    return (
      <div className="detail detail--empty container">
        <p>Картина не найдена</p>
        <Link to="/board" className="btn btn-secondary">← К объявлениям</Link>
      </div>
    )
  }

  return (
    <div className="detail">
      <div className="container detail__inner">
        <button className="detail__back btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>

        <div className="detail__grid">
          <div className="detail__image card">
            <img src={painting.imageUrl} alt={painting.title} />
          </div>

          <div className="detail__info">
            <span className={`badge ${painting.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
              {painting.status === 'available' ? 'В продаже' : 'Продано'}
            </span>
            <h1 className="detail__title">{painting.title}</h1>
            <p className="detail__artist">{painting.artist}</p>
            <p className="detail__price">{formatPrice(painting.price)}</p>

            <p className="detail__desc">{painting.description}</p>

            <dl className="detail__meta">
              <div><dt>Размер</dt><dd>{painting.width} × {painting.height} см</dd></div>
              <div><dt>Размещено</dt><dd>{new Date(painting.createdAt).toLocaleDateString('ru-RU')}</dd></div>
            </dl>

            {painting.status === 'available' ? (
              <Link to={`/checkout/${painting.id}`} className="btn btn-primary detail__buy">
                Купить картину
              </Link>
            ) : (
              <p className="detail__sold-note">Эта картина уже продана</p>
            )}

            <div className="detail__process">
              <h3>Как проходит покупка</h3>
              <ol>
                <li>Вы оплачиваете на сайте</li>
                <li>Geo Gallery выкупает картину у художника</li>
                <li>Мы упаковываем и отправляем вам</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
