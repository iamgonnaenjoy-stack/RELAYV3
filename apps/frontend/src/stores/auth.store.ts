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
  logoutReason: 'session-expired' | 'signed-out' | null
  setAuth: (user: User, token: string) => void
  clearAuth: (reason?: AuthState['logoutReason']) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      logoutReason: null,
      setAuth: (user, token) => set({ user, token, logoutReason: null }),
      clearAuth: (reason = null) => set({ user: null, token: null, logoutReason: reason }),
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
