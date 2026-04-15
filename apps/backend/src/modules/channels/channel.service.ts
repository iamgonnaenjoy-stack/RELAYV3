import { prisma } from '../../lib/prisma'
import { ensurePrimaryServer } from '../server/server.service'

export async function getAllChannels() {
  const server = await ensurePrimaryServer()

  return prisma.channel.findMany({
    where: { serverId: server.id },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      position: true,
      createdAt: true,
    },
  })
}

export async function getChannelById(id: string) {
  const channel = await prisma.channel.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      position: true,
      createdAt: true,
      serverId: true,
    },
  })
  if (!channel) throw { statusCode: 404, message: 'Channel not found' }
  return channel
}
