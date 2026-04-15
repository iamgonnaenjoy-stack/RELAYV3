import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth.middleware'
import { getAllChannels, getChannelById } from './channel.service'

export async function channelRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (_req, reply) => {
    const channels = await getAllChannels()
    return reply.send(channels)
  })

  app.get('/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      const channel = await getChannelById(id)
      return reply.send(channel)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

}
