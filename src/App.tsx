import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Board from './pages/Board'
import Gallery from './pages/Gallery'
import Sell from './pages/Sell'
import PaintingDetail from './pages/PaintingDetail'
import Checkout from './pages/Checkout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="board" element={<Board />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="sell" element={<Sell />} />
        <Route path="painting/:id" element={<PaintingDetail />} />
        <Route path="checkout/:id" element={<Checkout />} />
      </Route>
    </Routes>
  )
}
