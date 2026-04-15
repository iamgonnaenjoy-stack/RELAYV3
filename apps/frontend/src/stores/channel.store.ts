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
  setChannels: (channels: Channel[]) => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  setChannels: (channels) => set({ channels }),
}))
