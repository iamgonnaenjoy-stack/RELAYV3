import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email?: string | null
  avatar: string | null
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'relay-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
