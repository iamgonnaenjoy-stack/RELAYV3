import { create } from 'zustand'

export interface RelayServer {
  id: string
  key: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

interface ServerState {
  server: RelayServer | null
  loading: boolean
  setServer: (server: RelayServer) => void
  setLoading: (loading: boolean) => void
  resetServer: () => void
}

export const useServerStore = create<ServerState>((set) => ({
  server: null,
  loading: true,
  setServer: (server) => set({ server }),
  setLoading: (loading) => set({ loading }),
  resetServer: () => set({ server: null, loading: true }),
}))
