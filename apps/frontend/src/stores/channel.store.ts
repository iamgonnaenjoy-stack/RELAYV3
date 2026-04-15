import { create } from 'zustand'

export interface Channel {
  id: string
  name: string
  description: string | null
  type: 'TEXT' | 'VOICE'
  position: number
  createdAt: string
}

interface ChannelState {
  channels: Channel[]
  loading: boolean
  setChannels: (channels: Channel[]) => void
  setLoading: (loading: boolean) => void
  resetChannels: () => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  loading: true,
  setChannels: (channels) => set({ channels }),
  setLoading: (loading) => set({ loading }),
  resetChannels: () => set({ channels: [], loading: true }),
}))
