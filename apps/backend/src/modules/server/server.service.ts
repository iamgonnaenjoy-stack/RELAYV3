import { prisma } from '../../lib/prisma'

const PRIMARY_SERVER_KEY = 'primary'

export async function ensurePrimaryServer() {
  return prisma.relayServer.upsert({
    where: { key: PRIMARY_SERVER_KEY },
    update: {},
    create: {
      key: PRIMARY_SERVER_KEY,
      name: 'Relay',
      description: 'Private realtime communication',
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getPrimaryServer() {
  return ensurePrimaryServer()
}

export async function updatePrimaryServer(data: {
  name: string
  description?: string | null
}) {
  return prisma.relayServer.upsert({
    where: { key: PRIMARY_SERVER_KEY },
    update: {
      name: data.name,
      description: data.description ?? null,
    },
    create: {
      key: PRIMARY_SERVER_KEY,
      name: data.name,
      description: data.description ?? null,
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
