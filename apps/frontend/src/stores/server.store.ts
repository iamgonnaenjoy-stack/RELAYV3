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
  setServer: (server: RelayServer) => void
}

export const useServerStore = create<ServerState>((set) => ({
  server: null,
  setServer: (server) => set({ server }),
}))
