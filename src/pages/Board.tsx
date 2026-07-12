import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import PaintingCard from '../components/PaintingCard'
import './Board.css'

export default function Board() {
  const paintings = useStore((s) => s.paintings)
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all')
  const [sort, setSort] = useState<'new' | 'price-asc' | 'price-desc'>('new')

  const filtered = useMemo(() => {
    let list = [...paintings]
    if (filter === 'available') list = list.filter((p) => p.status === 'available')
    if (filter === 'sold') list = list.filter((p) => p.status === 'sold')

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return list
  }, [paintings, filter, sort])

  const availableCount = paintings.filter((p) => p.status === 'available').length

  return (
    <div className="board">
      <div className="container">
        <header className="board__header">
          <div>
            <h1 className="board__title">Доска объявлений</h1>
            <p className="board__subtitle">{availableCount} картин в продаже</p>
          </div>
          <div className="board__controls">
            <div className="board__filters">
              {(['all', 'available', 'sold'] as const).map((f) => (
                <button
                  key={f}
                  className={`board__filter ${filter === f ? 'board__filter--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Все' : f === 'available' ? 'В продаже' : 'Продано'}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="board__sort">
              <option value="new">Сначала новые</option>
              <option value="price-asc">Дешевле</option>
              <option value="price-desc">Дороже</option>
            </select>
          </div>
        </header>

        <div className="board__grid">
          {filtered.map((p) => (
            <PaintingCard key={p.id} id={p.id} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="board__empty">Нет объявлений по выбранному фильтру</p>
        )}
      </div>
    </div>
  )
}
