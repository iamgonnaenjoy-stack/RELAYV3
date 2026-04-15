import { create } from 'zustand'

export interface Message {
  id: string
  content: string
  edited: boolean
  createdAt: string
  channelId: string
  clientId?: string | null
  pending?: boolean
  failed?: boolean
  author: {
    id: string
    username: string
    avatar: string | null
  }
}

export interface MessagePage {
  items: Message[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ChannelMessageState {
  items: Message[]
  hasLoaded: boolean
  isLoading: boolean
  isLoadingOlder: boolean
  hasMore: boolean
  nextCursor: string | null
  error: string | null
  typingUsers: string[]
}

interface MessageState {
  channels: Record<string, ChannelMessageState>
  startInitialLoad: (channelId: string) => void
  finishInitialLoad: (channelId: string, page: MessagePage) => void
  failInitialLoad: (channelId: string, error: string) => void
  startLoadingOlder: (channelId: string) => void
  finishLoadingOlder: (channelId: string, page: MessagePage) => void
  failLoadingOlder: (channelId: string, error: string) => void
  addOptimisticMessage: (channelId: string, message: Message) => void
  reconcileIncomingMessage: (channelId: string, message: Message) => void
  markMessageFailed: (channelId: string, clientId: string) => void
  updateMessage: (channelId: string, updated: Message) => void
  deleteMessage: (channelId: string, messageId: string) => void
  addTypingUser: (channelId: string, username: string) => void
  removeTypingUser: (channelId: string, username: string) => void
  clearTypingUsers: (channelId: string) => void
  resetMessages: () => void
}

function createChannelState(overrides: Partial<ChannelMessageState> = {}): ChannelMessageState {
  return {
    items: [],
    hasLoaded: false,
    isLoading: false,
    isLoadingOlder: false,
    hasMore: false,
    nextCursor: null,
    error: null,
    typingUsers: [],
    ...overrides,
  }
}

function ensureChannel(
  channels: Record<string, ChannelMessageState>,
  channelId: string
): ChannelMessageState {
  return channels[channelId] ?? createChannelState()
}

function sortMessages(messages: Message[]) {
  return [...messages].sort((left, right) => {
    const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    if (timeDiff !== 0) {
      return timeDiff
    }

    return left.id.localeCompare(right.id)
  })
}

function normalizeMessage(existing: Message | undefined, incoming: Message): Message {
  return {
    ...existing,
    ...incoming,
    pending: incoming.pending ?? false,
    failed: incoming.failed ?? false,
  }
}

function upsertMessage(messages: Message[], incoming: Message) {
  const nextMessages = [...messages]
  const idMatchIndex = nextMessages.findIndex((message) => message.id === incoming.id)

  if (idMatchIndex >= 0) {
    nextMessages[idMatchIndex] = normalizeMessage(nextMessages[idMatchIndex], incoming)
    return sortMessages(nextMessages)
  }

  if (incoming.clientId) {
    const clientIdMatchIndex = nextMessages.findIndex(
      (message) => message.clientId && message.clientId === incoming.clientId
    )

    if (clientIdMatchIndex >= 0) {
      nextMessages[clientIdMatchIndex] = normalizeMessage(
        nextMessages[clientIdMatchIndex],
        incoming
      )
      return sortMessages(nextMessages)
    }
  }

  nextMessages.push(normalizeMessage(undefined, incoming))
  return sortMessages(nextMessages)
}

function mergePageIntoMessages(currentMessages: Message[], incomingMessages: Message[]) {
  return incomingMessages.reduce((messages, message) => upsertMessage(messages, message), currentMessages)
}

function getNextCursor(items: Message[], hasMore: boolean, fallback: string | null) {
  if (!hasMore) {
    return null
  }

  return items.find((message) => !message.pending)?.id ?? fallback
}

export const useMessageStore = create<MessageState>((set) => ({
  channels: {},

  startInitialLoad: (channelId) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            isLoading: true,
            error: null,
          },
        },
      }
    }),

  finishInitialLoad: (channelId, page) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)
      const mergedItems = mergePageIntoMessages(channel.items, page.items)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: mergedItems,
            hasLoaded: true,
            isLoading: false,
            error: null,
            hasMore: channel.hasMore || page.hasMore,
            nextCursor: getNextCursor(mergedItems, channel.hasMore || page.hasMore, page.nextCursor),
          },
        },
      }
    }),

  failInitialLoad: (channelId, error) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            isLoading: false,
            error,
          },
        },
      }
    }),

  startLoadingOlder: (channelId) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            isLoadingOlder: true,
            error: null,
          },
        },
      }
    }),

  finishLoadingOlder: (channelId, page) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)
      const mergedItems = mergePageIntoMessages(channel.items, page.items)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: mergedItems,
            hasLoaded: true,
            isLoadingOlder: false,
            error: null,
            hasMore: page.hasMore,
            nextCursor: getNextCursor(mergedItems, page.hasMore, page.nextCursor),
          },
        },
      }
    }),

  failLoadingOlder: (channelId, error) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            isLoadingOlder: false,
            error,
          },
        },
      }
    }),

  addOptimisticMessage: (channelId, message) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: upsertMessage(channel.items, {
              ...message,
              pending: true,
              failed: false,
            }),
            hasLoaded: true,
            error: null,
          },
        },
      }
    }),

  reconcileIncomingMessage: (channelId, message) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: upsertMessage(channel.items, {
              ...message,
              pending: false,
              failed: false,
            }),
          },
        },
      }
    }),

  markMessageFailed: (channelId, clientId) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: channel.items.map((message) =>
              message.clientId === clientId
                ? {
                    ...message,
                    pending: false,
                    failed: true,
                  }
                : message
            ),
          },
        },
      }
    }),

  updateMessage: (channelId, updated) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: channel.items.map((message) =>
              message.id === updated.id ? normalizeMessage(message, updated) : message
            ),
          },
        },
      }
    }),

  deleteMessage: (channelId, messageId) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            items: channel.items.filter((message) => message.id !== messageId),
          },
        },
      }
    }),

  addTypingUser: (channelId, username) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      if (!username || channel.typingUsers.includes(username)) {
        return state
      }

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            typingUsers: [...channel.typingUsers, username],
          },
        },
      }
    }),

  removeTypingUser: (channelId, username) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            typingUsers: channel.typingUsers.filter((entry) => entry !== username),
          },
        },
      }
    }),

  clearTypingUsers: (channelId) =>
    set((state) => {
      const channel = ensureChannel(state.channels, channelId)

      return {
        channels: {
          ...state.channels,
          [channelId]: {
            ...channel,
            typingUsers: [],
          },
        },
      }
    }),

  resetMessages: () => set({ channels: {} }),
}))
