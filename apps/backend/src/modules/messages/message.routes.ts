import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth.middleware'
import { getMessages, createMessage, editMessage, deleteMessage } from './message.service'
import { getRealtimeServer } from '../realtime/socket.state'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  channelId: z.string().cuid(),
  replyToId: z.string().cuid().nullable().optional(),
})

const editMessageSchema = z.object({
  content: z.string().min(1).max(4000),
})

export async function messageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/messages?channelId=xxx&cursor=yyy
  app.get('/', async (req, reply) => {
    const { channelId, cursor } = req.query as { channelId: string; cursor?: string }
    if (!channelId) return reply.code(400).send({ error: 'channelId is required' })

    try {
      const messages = await getMessages(channelId, cursor)
      return reply.send(messages)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  // POST /api/messages
  app.post('/', async (req, reply) => {
    const body = createMessageSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    try {
      const payload = req.user as { sub: string }
      const message = await createMessage({ ...body.data, authorId: payload.sub })
      return reply.code(201).send(message)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  // PATCH /api/messages/:id
  app.patch('/:id', async (req, reply) => {
    const body = editMessageSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    try {
      const { id } = req.params as { id: string }
      const payload = req.user as { sub: string }
      const message = await editMessage(id, body.data.content, payload.sub)
      getRealtimeServer()?.to(message.channelId).emit('message_updated', message)
      return reply.send(message)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  // DELETE /api/messages/:id
  app.delete('/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      const payload = req.user as { sub: string }
      const deletedMessage = await deleteMessage(id, payload.sub)
      getRealtimeServer()
        ?.to(deletedMessage.channelId)
        .emit('message_deleted', { channelId: deletedMessage.channelId, messageId: deletedMessage.id })
      return reply.code(204).send()
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })
}
