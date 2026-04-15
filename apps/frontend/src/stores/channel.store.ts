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
  activeChannelId: string | null
  setChannels: (channels: Channel[]) => void
  setActiveChannel: (id: string) => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  activeChannelId: null,
  setChannels: (channels) => set({ channels }),
  setActiveChannel: (id) => set({ activeChannelId: id }),
}))
