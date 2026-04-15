import { FastifyInstance } from 'fastify'
import { authenticateAdmin } from '../../middleware/auth.middleware'
import {
  adminLoginSchema,
  createAdminUserSchema,
  createChannelSchema,
  updateChannelSchema,
  updateServerSchema,
} from './admin.schema'
import {
  createAdminChannel,
  createAdminUser,
  deleteAdminChannel,
  getAdminOverview,
  getAdminServer,
  listAdminChannels,
  listAdminUsers,
  loginAdmin,
  regenerateUserAccessKey,
  saveAdminServer,
  updateAdminChannel,
} from './admin.service'

export async function adminRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const body = adminLoginSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    try {
      const result = await loginAdmin(body.data, app)
      return reply.send(result)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  app.addHook('preHandler', authenticateAdmin)

  app.get('/overview', async (_req, reply) => {
    const overview = await getAdminOverview()
    return reply.send(overview)
  })

  app.get('/server', async (_req, reply) => {
    const server = await getAdminServer()
    return reply.send(server)
  })

  app.put('/server', async (req, reply) => {
    const body = updateServerSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    const server = await saveAdminServer(body.data)
    return reply.send(server)
  })

  app.get('/users', async (_req, reply) => {
    const users = await listAdminUsers()
    return reply.send(users)
  })

  app.post('/users', async (req, reply) => {
    const body = createAdminUserSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    try {
      const created = await createAdminUser(body.data)
      return reply.code(201).send(created)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  app.post('/users/:id/reset-access-key', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      const created = await regenerateUserAccessKey(id)
      return reply.send(created)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  app.get('/channels', async (_req, reply) => {
    const channels = await listAdminChannels()
    return reply.send(channels)
  })

  app.post('/channels', async (req, reply) => {
    const body = createChannelSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    const channel = await createAdminChannel(body.data)
    return reply.code(201).send(channel)
  })

  app.patch('/channels/:id', async (req, reply) => {
    const body = updateChannelSchema.safeParse(req.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: body.error.flatten() })
    }

    try {
      const { id } = req.params as { id: string }
      const channel = await updateAdminChannel(id, body.data)
      return reply.send(channel)
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })

  app.delete('/channels/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      await deleteAdminChannel(id)
      return reply.code(204).send()
    } catch (err: any) {
      return reply.code(err.statusCode || 500).send({ error: err.message })
    }
  })
}
