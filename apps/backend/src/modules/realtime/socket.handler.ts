import { FastifyInstance } from 'fastify'
import { Server, Socket } from 'socket.io'
import { RelayJwtPayload } from '../../middleware/auth.middleware'
import { createMessage } from '../messages/message.service'

interface JoinChannelPayload {
  channelId: string
}

interface SendMessagePayload {
  channelId: string
  content: string
  clientId?: string
  replyToId?: string | null
}

type SendMessageAck =
  | {
      ok: true
      message: Awaited<ReturnType<typeof createMessage>> & { clientId?: string | null }
    }
  | {
      ok: false
      error: string
    }

function getTokenFromSocket(socket: Socket) {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken
  }

  const header = socket.handshake.headers.authorization
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length)
  }

  return null
}

export function registerSocketHandlers(io: Server, app: FastifyInstance) {
  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket)
      if (!token) {
        return next(new Error('Unauthorized'))
      }

      const payload = app.jwt.verify<RelayJwtPayload>(token)
      if (payload.scope === 'admin') {
        return next(new Error('Unauthorized'))
      }

      socket.data.userId = payload.sub
      socket.data.username = payload.username ?? 'member'
      return next()
    } catch {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    socket.on('join_channel', ({ channelId }: JoinChannelPayload) => {
      socket.join(channelId)
      console.log(`[Socket] ${socket.id} joined channel: ${channelId}`)
    })

    socket.on('leave_channel', ({ channelId }: JoinChannelPayload) => {
      socket.leave(channelId)
      console.log(`[Socket] ${socket.id} left channel: ${channelId}`)
    })

    socket.on('send_message', async (payload: SendMessagePayload, acknowledgement?: (response: SendMessageAck) => void) => {
      try {
        const message = await createMessage({
          content: payload.content,
          channelId: payload.channelId,
          authorId: socket.data.userId as string,
          replyToId: payload.replyToId ?? null,
        })

        const broadcastMessage = {
          ...message,
          clientId: payload.clientId ?? null,
        }

        io.to(payload.channelId).emit('receive_message', broadcastMessage)
        acknowledgement?.({
          ok: true,
          message: broadcastMessage,
        })
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' })
        acknowledgement?.({
          ok: false,
          error: 'Failed to send message',
        })
        console.error('[Socket] send_message error:', err)
      }
    })

    socket.on('typing_start', ({ channelId }: JoinChannelPayload) => {
      socket.to(channelId).emit('user_typing', { channelId, username: socket.data.username })
    })

    socket.on('typing_stop', ({ channelId }: JoinChannelPayload) => {
      socket.to(channelId).emit('user_stopped_typing', { channelId, username: socket.data.username })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`)
    })
  })
}
