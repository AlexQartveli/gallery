import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Board from './pages/Board'
import Galleries from './pages/Galleries'
import CategoryGallery from './pages/CategoryGallery'
import Artists from './pages/Artists'
import ArtistProfile from './pages/ArtistProfile'
import ArtworkDetail from './pages/ArtworkDetail'
import Pricing from './pages/Pricing'
import Sell from './pages/Sell'
import PlacementCheckout from './pages/PlacementCheckout'
import Promote from './pages/Promote'
import PurchaseCheckout from './pages/PurchaseCheckout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="board" element={<Board />} />
        <Route path="galleries" element={<Galleries />} />
        <Route path="gallery/:category" element={<CategoryGallery />} />
        <Route path="artists" element={<Artists />} />
        <Route path="artist/:id" element={<ArtistProfile />} />
        <Route path="artwork/:id" element={<ArtworkDetail />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="sell" element={<Sell />} />
        <Route path="place-checkout" element={<PlacementCheckout />} />
        <Route path="promote/:id" element={<Promote />} />
        <Route path="checkout/:id" element={<PurchaseCheckout />} />
      </Route>
    </Routes>
  )
}
