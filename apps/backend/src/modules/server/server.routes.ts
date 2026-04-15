import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth.middleware'
import { getPrimaryServer } from './server.service'

export async function serverRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (_req, reply) => {
    const server = await getPrimaryServer()
    return reply.send(server)
  })
}
