import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'
import { useChannelStore } from '@/stores/channel.store'
import { Message, useMessageStore } from '@/stores/message.store'
import { useShellStore } from '@/stores/shell.store'

interface SendMessagePayload {
  channelId: string
  content: string
  clientId: string
  replyToId?: string | null
}

type SendMessageResponse =
  | {
      ok: true
      message: Message
    }
  | {
      ok: false
      error: string
    }

let socket: Socket | null = null
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function typingTimerKey(channelId: string, username: string) {
  return `${channelId}:${username}`
}

function clearTypingTimer(channelId: string, username: string) {
  const key = typingTimerKey(channelId, username)
  const existingTimer = typingTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
    typingTimers.delete(key)
  }
}

function scheduleTypingExpiry(channelId: string, username: string) {
  clearTypingTimer(channelId, username)
  const timer = setTimeout(() => {
    useMessageStore.getState().removeTypingUser(channelId, username)
    typingTimers.delete(typingTimerKey(channelId, username))
  }, 3200)

  typingTimers.set(typingTimerKey(channelId, username), timer)
}

function clearAllTypingTimers() {
  typingTimers.forEach((timer) => clearTimeout(timer))
  typingTimers.clear()
}

function handleIncomingMessage(message: Message) {
  useMessageStore.getState().reconcileIncomingMessage(message.channelId, message)
  useMessageStore.getState().removeTypingUser(message.channelId, message.author.username)

  const currentUserId = useAuthStore.getState().user?.id
  const { activeChannelId, incrementUnread, markChannelRead } = useChannelStore.getState()
  const shouldIncrementUnread =
    message.author.id !== currentUserId &&
    (document.visibilityState !== 'visible' || activeChannelId !== message.channelId)

  if (shouldIncrementUnread) {
    incrementUnread(message.channelId)
    return
  }

  markChannelRead(message.channelId)
}

function setDisconnectedState(message?: string) {
  useShellStore.getState().setConnectionState('disconnected', message ?? 'Realtime connection lost.')
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:4000', {
      withCredentials: true,
      autoConnect: false,
      auth: {
        token: useAuthStore.getState().token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    })

    socket.on('receive_message', handleIncomingMessage)

    socket.on('message_updated', (message: Message) => {
      useMessageStore.getState().updateMessage(message.channelId, message)
    })

    socket.on('message_deleted', ({ channelId, messageId }: { channelId: string; messageId: string }) => {
      useMessageStore.getState().deleteMessage(channelId, messageId)
    })

    socket.on('user_typing', ({ channelId, username }: { channelId: string; username: string }) => {
      useMessageStore.getState().addTypingUser(channelId, username)
      scheduleTypingExpiry(channelId, username)
    })

    socket.on(
      'user_stopped_typing',
      ({ channelId, username }: { channelId: string; username: string }) => {
        clearTypingTimer(channelId, username)
        useMessageStore.getState().removeTypingUser(channelId, username)
      }
    )

    socket.on('connect', () => {
      useShellStore.getState().setConnectionState('connected')
    })

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        useShellStore.getState().setConnectionState('idle')
        return
      }

      setDisconnectedState('Realtime connection lost. Trying to restore it...')
    })

    socket.on('connect_error', (error: Error) => {
      if (error.message === 'Unauthorized') {
        const token = useAuthStore.getState().token
        if (token) {
          useAuthStore.getState().clearAuth('session-expired')
        }
        setDisconnectedState('Session expired. Please sign in again.')
        return
      }

      setDisconnectedState('Unable to establish realtime connection.')
      console.error('[Socket] Connect error:', error.message)
    })

    socket.on('error', (err: unknown) => {
      setDisconnectedState('Realtime encountered an unexpected error.')
      console.error('[Socket] Error:', err)
    })

    socket.io.on('reconnect_attempt', () => {
      useShellStore
        .getState()
        .setConnectionState('reconnecting', 'Reconnecting to realtime...')
    })

    socket.io.on('reconnect', () => {
      useShellStore.getState().setConnectionState('connected')
    })

    socket.io.on('reconnect_failed', () => {
      setDisconnectedState('Realtime could not reconnect.')
    })
  }

  return socket
}

export function connectSocket() {
  const token = useAuthStore.getState().token
  if (!token) {
    useShellStore.getState().setConnectionState('idle')
    return
  }

  const instance = getSocket()
  instance.auth = {
    token,
  }

  if (instance.connected || instance.active) {
    return
  }

  useShellStore.getState().setConnectionState('connecting', 'Connecting to realtime...')
  instance.connect()
}

export function disconnectSocket() {
  clearAllTypingTimers()
  socket?.disconnect()
  socket = null
  useShellStore.getState().setConnectionState('idle')
}

export function joinChannel(channelId: string) {
  getSocket().emit('join_channel', { channelId })
}

export function leaveChannel(channelId: string) {
  getSocket().emit('leave_channel', { channelId })
}

export function sendSocketMessage(payload: SendMessagePayload) {
  const instance = getSocket()
  if (!instance.connected) {
    return Promise.resolve<SendMessageResponse>({
      ok: false,
      error: 'Realtime is disconnected.',
    })
  }

  return new Promise<SendMessageResponse>((resolve) => {
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      resolve({
        ok: false,
        error: 'Message send timed out.',
      })
    }, 8000)

    instance.emit('send_message', payload, (response?: SendMessageResponse) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)

      if (response) {
        resolve(response)
        return
      }

      resolve({
        ok: false,
        error: 'No response from realtime server',
      })
    })
  })
}

export function emitTypingStart(channelId: string) {
  getSocket().emit('typing_start', { channelId })
}

export function emitTypingStop(channelId: string) {
  getSocket().emit('typing_stop', { channelId })
}
