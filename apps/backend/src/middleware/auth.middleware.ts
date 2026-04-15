import { FastifyReply, FastifyRequest } from 'fastify'

export interface RelayJwtPayload {
  sub: string
  username?: string
  scope?: 'member' | 'admin'
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()

    const payload = req.user as RelayJwtPayload
    if (payload.scope === 'admin') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

export async function authenticateAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()

    const payload = req.user as RelayJwtPayload
    if (payload.scope !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
