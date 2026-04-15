import { io, Socket } from 'socket.io-client'
import { Message, useMessageStore } from '@/stores/message.store'
import { useAuthStore } from '@/stores/auth.store'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:4000', {
      withCredentials: true,
      autoConnect: false,
      auth: {
        token: useAuthStore.getState().token,
      },
    })

    socket.on('receive_message', (message: Message) => {
      useMessageStore.getState().addMessage(message.channelId, message)
    })

    socket.on('connect', () => console.log('[Socket] Connected'))
    socket.on('disconnect', () => console.log('[Socket] Disconnected'))
    socket.on('connect_error', (error: Error) => console.error('[Socket] Connect error:', error.message))
    socket.on('error', (err: unknown) => console.error('[Socket] Error:', err))
  }

  return socket
}

export function connectSocket() {
  const instance = getSocket()
  instance.auth = {
    token: useAuthStore.getState().token,
  }
  instance.connect()
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function joinChannel(channelId: string) {
  getSocket().emit('join_channel', { channelId })
}

export function leaveChannel(channelId: string) {
  getSocket().emit('leave_channel', { channelId })
}

export function sendSocketMessage(payload: { channelId: string; content: string }) {
  getSocket().emit('send_message', payload)
}

export function emitTypingStart(channelId: string) {
  getSocket().emit('typing_start', { channelId })
}

export function emitTypingStop(channelId: string) {
  getSocket().emit('typing_stop', { channelId })
}
