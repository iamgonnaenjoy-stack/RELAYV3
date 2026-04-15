import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  activeChannelId: string | null
  unreadByChannel: Record<string, number>
  draftsByChannel: Record<string, string>
  setChannels: (channels: Channel[]) => void
  setLoading: (loading: boolean) => void
  setActiveChannel: (channelId: string | null) => void
  incrementUnread: (channelId: string) => void
  markChannelRead: (channelId: string) => void
  setDraft: (channelId: string, draft: string) => void
  clearDraft: (channelId: string) => void
  resetChannels: () => void
}

export const useChannelStore = create<ChannelState>()(
  persist(
    (set) => ({
      channels: [],
      loading: true,
      activeChannelId: null,
      unreadByChannel: {},
      draftsByChannel: {},
      setChannels: (channels) =>
        set((state) => {
          const orderedChannels = [...channels].sort((left, right) => left.position - right.position)
          const validIds = new Set(orderedChannels.map((channel) => channel.id))

          return {
            channels: orderedChannels,
            activeChannelId:
              state.activeChannelId && validIds.has(state.activeChannelId)
                ? state.activeChannelId
                : null,
            unreadByChannel: Object.fromEntries(
              Object.entries(state.unreadByChannel).filter(([channelId]) => validIds.has(channelId))
            ),
            draftsByChannel: Object.fromEntries(
              Object.entries(state.draftsByChannel).filter(([channelId]) => validIds.has(channelId))
            ),
          }
        }),
      setLoading: (loading) => set({ loading }),
      setActiveChannel: (channelId) =>
        set((state) => ({
          activeChannelId: channelId,
          unreadByChannel: channelId
            ? { ...state.unreadByChannel, [channelId]: 0 }
            : state.unreadByChannel,
        })),
      incrementUnread: (channelId) =>
        set((state) => ({
          unreadByChannel: {
            ...state.unreadByChannel,
            [channelId]: (state.unreadByChannel[channelId] ?? 0) + 1,
          },
        })),
      markChannelRead: (channelId) =>
        set((state) => ({
          unreadByChannel: {
            ...state.unreadByChannel,
            [channelId]: 0,
          },
        })),
      setDraft: (channelId, draft) =>
        set((state) => ({
          draftsByChannel: {
            ...state.draftsByChannel,
            [channelId]: draft,
          },
        })),
      clearDraft: (channelId) =>
        set((state) => {
          const nextDrafts = { ...state.draftsByChannel }
          delete nextDrafts[channelId]

          return {
            draftsByChannel: nextDrafts,
          }
        }),
      resetChannels: () =>
        set({
          channels: [],
          loading: true,
          activeChannelId: null,
          unreadByChannel: {},
          draftsByChannel: {},
        }),
    }),
    {
      name: 'relay-channel-ui',
      partialize: (state) => ({
        draftsByChannel: state.draftsByChannel,
      }),
    }
  )
)
