import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import ArtworkCard from '../components/ArtworkCard'
import type { CategoryId } from '../types'
import './Board.css'

export default function Board() {
  const artworks = useStore((s) => s.artworks)
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('active')
  const [sort, setSort] = useState<'new' | 'price-asc' | 'price-desc'>('new')

  const filtered = useMemo(() => {
    let list = [...artworks]
    if (category !== 'all') list = list.filter((a) => a.category === category)
    if (filter === 'active') list = list.filter((a) => a.status === 'active')
    if (filter === 'sold') list = list.filter((a) => a.status === 'sold')
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [artworks, category, filter, sort])

  return (
    <div className="board">
      <div className="container">
        <header className="board__header">
          <div>
            <h1 className="board__title">Каталог</h1>
            <p className="board__subtitle">{filtered.length} лотов</p>
          </div>
        </header>

        <div className="board__cats">
          <button className={`board__cat ${category === 'all' ? 'board__cat--active' : ''}`} onClick={() => setCategory('all')}>Все</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`board__cat ${category === c.id ? 'board__cat--active' : ''}`} onClick={() => setCategory(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div className="board__controls">
          <div className="board__filters">
            {(['all', 'active', 'sold'] as const).map((f) => (
              <button key={f} className={`board__filter ${filter === f ? 'board__filter--active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Все' : f === 'active' ? 'В продаже' : 'Продано'}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="board__sort">
            <option value="new">Сначала новые</option>
            <option value="price-asc">Дешевле</option>
            <option value="price-desc">Дороже</option>
          </select>
        </div>

        <div className="board__grid">
          {filtered.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
        </div>
      </div>
    </div>
  )
}
