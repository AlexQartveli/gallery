import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Artist,
  Artwork,
  BoostOrder,
  NewArtwork,
  PlacementOrder,
  PurchaseOrder,
  VipBoosts,
} from '../types'
import { SEED_ARTISTS, SEED_ARTWORKS } from '../data/seed'
import { getTariff } from '../data/tariffs'
import { getBoost } from '../data/boosts'

interface CurrentUser {
  artistId: string
  tariffId: string
  tariffExpiresAt: string
}

interface AppState {
  artists: Artist[]
  artworks: Artwork[]
  placementOrders: PlacementOrder[]
  purchaseOrders: PurchaseOrder[]
  boostOrders: BoostOrder[]
  currentUser: CurrentUser | null

  getArtist: (id: string) => Artist | undefined
  getArtwork: (id: string) => Artwork | undefined
  getArtistWorks: (artistId: string) => Artwork[]
  getCategoryWorks: (category: string) => Artwork[]
  getActiveListingsCount: (artistId: string) => number

  setCurrentUser: (artistId: string) => void
  updateArtist: (id: string, data: Partial<Artist>) => void
  addArtwork: (artwork: NewArtwork) => Artwork | null
  purchaseArtwork: (artworkId: string, buyer: { name: string; email: string; address: string }) => PurchaseOrder | null
  payPlacement: (tariffId: string, artistId: string) => PlacementOrder | null
  payBoost: (boostId: string, artistId: string, artworkId?: string) => BoostOrder | null
  applyBoostToArtwork: (artworkId: string, boostId: string) => void
  canAddListing: (artistId: string) => { ok: boolean; reason?: string }
}

function buildVipBoosts(boostId: string, periodDays: number): Partial<VipBoosts> {
  const expires = new Date(Date.now() + periodDays * 86400000).toISOString()
  if (boostId === 'pack') {
    return { crown: expires, spotlight: expires, catalog: expires }
  }
  if (boostId === 'crown') return { crown: expires }
  if (boostId === 'spotlight') return { spotlight: expires }
  if (boostId === 'catalog') return { catalog: expires }
  return {}
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      artists: SEED_ARTISTS,
      artworks: SEED_ARTWORKS,
      placementOrders: [],
      purchaseOrders: [],
      boostOrders: [],
      currentUser: { artistId: 'artist-1', tariffId: 'studio', tariffExpiresAt: new Date(Date.now() + 180 * 86400000).toISOString() },

      getArtist: (id) => get().artists.find((a) => a.id === id),
      getArtwork: (id) => get().artworks.find((a) => a.id === id),
      getArtistWorks: (artistId) => get().artworks.filter((a) => a.artistId === artistId && a.status !== 'draft'),
      getCategoryWorks: (category) => {
        const list = get().artworks.filter((a) => a.category === category && a.status === 'active')
        return list.sort((a, b) => {
          const aVip = a.vipBoosts?.catalog ? 1 : 0
          const bVip = b.vipBoosts?.catalog ? 1 : 0
          if (aVip !== bVip) return bVip - aVip
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        })
      },
      getActiveListingsCount: (artistId) =>
        get().artworks.filter((a) => a.artistId === artistId && a.status === 'active').length,

      setCurrentUser: (artistId) => {
        const artist = get().artists.find((a) => a.id === artistId)
        if (!artist) return
        set({
          currentUser: {
            artistId,
            tariffId: artist.tariffId,
            tariffExpiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
          },
        })
      },

      updateArtist: (id, data) => {
        set((s) => ({
          artists: s.artists.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }))
      },

      canAddListing: (artistId) => {
        const user = get().currentUser
        const artist = get().artists.find((a) => a.id === artistId)
        if (!artist) return { ok: false, reason: 'Автор не найден' }
        const tariff = getTariff(user?.tariffId ?? artist.tariffId)
        if (!tariff) return { ok: false, reason: 'Тариф не найден' }
        const count = get().getActiveListingsCount(artistId)
        if (count >= tariff.maxListings) {
          return { ok: false, reason: `Лимит тарифа «${tariff.name}»: ${tariff.maxListings} лотов` }
        }
        if (user && new Date(user.tariffExpiresAt) < new Date()) {
          return { ok: false, reason: 'Срок тарифа истёк. Продлите размещение.' }
        }
        return { ok: true }
      },

      addArtwork: (data) => {
        const check = get().canAddListing(data.artistId)
        if (!check.ok) return null

        const user = get().currentUser
        const tariff = getTariff(user?.tariffId ?? 'starter')
        const periodDays = tariff?.periodDays ?? 30

        const artwork: Artwork = {
          ...data,
          id: `artwork-${Date.now()}`,
          status: 'active',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + periodDays * 86400000).toISOString(),
          featured: data.vipBoosts?.catalog ? true : (tariff?.featured ?? false),
        }

        set((s) => ({ artworks: [artwork, ...s.artworks] }))
        return artwork
      },

      payPlacement: (tariffId, artistId) => {
        const tariff = getTariff(tariffId)
        if (!tariff) return null

        const order: PlacementOrder = {
          id: `place-${Date.now()}`,
          tariffId,
          artistId,
          amount: tariff.price,
          status: 'paid',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + tariff.periodDays * 86400000).toISOString(),
        }

        set((s) => ({
          placementOrders: [order, ...s.placementOrders],
          artists: s.artists.map((a) => (a.id === artistId ? { ...a, tariffId } : a)),
          currentUser: { artistId, tariffId, tariffExpiresAt: order.expiresAt },
        }))

        return order
      },

      payBoost: (boostId, artistId, artworkId) => {
        const boost = getBoost(boostId)
        if (!boost) return null

        const order: BoostOrder = {
          id: `boost-${Date.now()}`,
          boostId,
          artistId,
          artworkId,
          amount: boost.price,
          status: 'paid',
          createdAt: new Date().toISOString(),
          expiresAt: boost.periodDays > 0
            ? new Date(Date.now() + boost.periodDays * 86400000).toISOString()
            : new Date().toISOString(),
        }

        set((s) => ({ boostOrders: [order, ...s.boostOrders] }))

        if (artworkId && boostId !== 'ai_photo') {
          get().applyBoostToArtwork(artworkId, boostId)
        }

        return order
      },

      applyBoostToArtwork: (artworkId, boostId) => {
        const boost = getBoost(boostId)
        if (!boost || boost.periodDays === 0) return

        const vipUpdate = buildVipBoosts(boostId, boost.periodDays)

        set((s) => ({
          artworks: s.artworks.map((a) => {
            if (a.id !== artworkId) return a
            const merged: VipBoosts = { ...a.vipBoosts, ...vipUpdate }
            return {
              ...a,
              vipBoosts: merged,
              featured: merged.catalog ? true : a.featured,
            }
          }),
        }))
      },

      purchaseArtwork: (artworkId, buyer) => {
        const artwork = get().artworks.find((a) => a.id === artworkId)
        if (!artwork || artwork.status !== 'active') return null

        const order: PurchaseOrder = {
          id: `buy-${Date.now()}`,
          artworkId,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerAddress: buyer.address,
          amount: artwork.price,
          status: 'paid',
          createdAt: new Date().toISOString(),
        }

        set((s) => ({
          artworks: s.artworks.map((a) =>
            a.id === artworkId ? { ...a, status: 'sold' as const } : a
          ),
          purchaseOrders: [order, ...s.purchaseOrders],
        }))

        return order
      },
    }),
    { name: 'geo-gallery-store-v3' }
  )
)
