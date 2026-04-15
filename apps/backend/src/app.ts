import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { Server } from 'socket.io'

import { prisma } from './lib/prisma'
import { adminRoutes } from './modules/admin/admin.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { channelRoutes } from './modules/channels/channel.routes'
import { messageRoutes } from './modules/messages/message.routes'
import { registerSocketHandlers } from './modules/realtime/socket.handler'
import { serverRoutes } from './modules/server/server.routes'

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins
  }

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ]
}

export async function buildApp() {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'development',
  })

  const allowedOrigins = getAllowedOrigins()

  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed'), false)
    },
    credentials: true,
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || 'relay_access_secret',
  })

  await fastify.register(cookie)

  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(adminRoutes, { prefix: '/api/admin' })
  await fastify.register(serverRoutes, { prefix: '/api/server' })
  await fastify.register(channelRoutes, { prefix: '/api/channels' })
  await fastify.register(messageRoutes, { prefix: '/api/messages' })

  fastify.get('/health', async () => ({ status: 'ok', app: 'relay' }))

  const io = new Server(fastify.server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  registerSocketHandlers(io, fastify)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  return fastify
}
