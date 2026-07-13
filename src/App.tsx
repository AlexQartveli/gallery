import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import Home from './pages/Home'
import Board from './pages/Board'
import Galleries from './pages/Galleries'
import Artists from './pages/Artists'
import ArtistProfile from './pages/ArtistProfile'
import ArtworkDetail from './pages/ArtworkDetail'
import Pricing from './pages/Pricing'
import PlacementCheckout from './pages/PlacementCheckout'
import Promote from './pages/Promote'
import PurchaseCheckout from './pages/PurchaseCheckout'

const CategoryGallery = lazy(() => import('./pages/CategoryGallery'))
const Sell = lazy(() => import('./pages/Sell'))
const PhotoUploadTest = lazy(() => import('./pages/PhotoUploadTest'))

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="board" element={<Board />} />
          <Route path="galleries" element={<Galleries />} />
          <Route
            path="gallery/:category"
            element={
              <Suspense fallback={<PageLoader label="Загрузка 3D-галереи…" />}>
                <CategoryGallery />
              </Suspense>
            }
          />
          <Route path="artists" element={<Artists />} />
          <Route path="artist/:id" element={<ArtistProfile />} />
          <Route path="artwork/:id" element={<ArtworkDetail />} />
          <Route path="pricing" element={<Pricing />} />
          <Route
            path="sell"
            element={
              <Suspense fallback={<PageLoader label="Загрузка…" />}>
                <Sell />
              </Suspense>
            }
          />
          <Route path="place-checkout" element={<PlacementCheckout />} />
          <Route path="promote/:id" element={<Promote />} />
          <Route path="checkout/:id" element={<PurchaseCheckout />} />
          <Route
            path="test-upload"
            element={
              <Suspense fallback={<PageLoader label="Загрузка…" />}>
                <PhotoUploadTest />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
