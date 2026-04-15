import { create } from 'zustand'

export interface Message {
  id: string
  content: string
  edited: boolean
  createdAt: string
  channelId: string
  author: {
    id: string
    username: string
    avatar: string | null
  }
}

interface MessageState {
  messages: Record<string, Message[]> // keyed by channelId
  addMessage: (channelId: string, message: Message) => void
  setMessages: (channelId: string, messages: Message[]) => void
  updateMessage: (channelId: string, updated: Message) => void
  deleteMessage: (channelId: string, messageId: string) => void
  resetMessages: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},

  setMessages: (channelId, messages) =>
    set((s) => ({ messages: { ...s.messages, [channelId]: messages } })),

  addMessage: (channelId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [channelId]: [...(s.messages[channelId] ?? []), message],
      },
    })),

  updateMessage: (channelId, updated) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [channelId]: (s.messages[channelId] ?? []).map((m) =>
          m.id === updated.id ? updated : m
        ),
      },
    })),

  deleteMessage: (channelId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [channelId]: (s.messages[channelId] ?? []).filter((m) => m.id !== messageId),
      },
    })),

  resetMessages: () => set({ messages: {} }),
}))
