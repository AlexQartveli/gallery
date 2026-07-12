import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Painting } from '../data/paintings'
import { PAINTINGS } from '../data/paintings'

export interface Order {
  id: string
  paintingId: string
  buyerName: string
  buyerEmail: string
  buyerAddress: string
  amount: number
  status: 'paid' | 'artist_paid' | 'shipped' | 'delivered'
  createdAt: string
}

export interface NewListing {
  title: string
  artist: string
  description: string
  price: number
  width: number
  height: number
  imageUrl: string
}

interface AppState {
  paintings: Painting[]
  orders: Order[]
  addListing: (listing: NewListing) => void
  purchasePainting: (paintingId: string, buyer: { name: string; email: string; address: string }) => Order | null
  getPainting: (id: string) => Painting | undefined
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      paintings: PAINTINGS,
      orders: [],

      addListing: (listing) => {
        const painting: Painting = {
          ...listing,
          id: `painting-${Date.now()}`,
          status: 'available',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ paintings: [painting, ...state.paintings] }))
      },

      purchasePainting: (paintingId, buyer) => {
        const painting = get().paintings.find((p) => p.id === paintingId)
        if (!painting || painting.status !== 'available') return null

        const order: Order = {
          id: `order-${Date.now()}`,
          paintingId,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerAddress: buyer.address,
          amount: painting.price,
          status: 'paid',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          paintings: state.paintings.map((p) =>
            p.id === paintingId ? { ...p, status: 'sold' as const } : p
          ),
          orders: [order, ...state.orders],
        }))

        return order
      },

      getPainting: (id) => get().paintings.find((p) => p.id === id),
    }),
    { name: 'artvault-store' }
  )
)
