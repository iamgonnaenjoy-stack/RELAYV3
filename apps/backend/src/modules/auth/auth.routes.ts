import { FastifyInstance } from 'fastify'
import { loginSchema } from './auth.schema'
import { loginUser, getMe } from './auth.service'
import { authenticate } from '../../middleware/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }
    try {
      const result = await loginUser(body.data, app)
      return reply.code(200).send(result)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  // GET /api/auth/me  (protected)
  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const payload = req.user as { sub: string }
      const user = await getMe(payload.sub)
      return reply.send(user)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })
}
