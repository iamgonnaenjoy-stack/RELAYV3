import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import {
  AdminLoginInput,
  CreateAdminUserInput,
  CreateChannelInput,
  UpdateChannelInput,
  UpdateServerInput,
} from './admin.schema'
import { ensurePrimaryServer, getPrimaryServer, updatePrimaryServer } from '../server/server.service'

const ACCESS_KEY_PREFIX = 'relay_'

function generateTokenPart(size = 18) {
  return randomBytes(size).toString('base64url').replace(/[-_]/g, '').slice(0, size)
}

async function generateUniqueAccessKeyId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateTokenPart(12).toLowerCase()
    const existing = await prisma.user.findUnique({
      where: { accessKeyId: candidate },
      select: { id: true },
    })

    if (!existing) return candidate
  }

  throw { statusCode: 500, message: 'Failed to generate a unique access key id' }
}

function formatAccessKey(accessKeyId: string, secret: string) {
  return `${ACCESS_KEY_PREFIX}${accessKeyId}.${secret}`
}

function throwUserConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : []

    if (target.includes('email')) {
      throw {
        statusCode: 409,
        message: 'Email is already assigned to another member',
      }
    }

    if (target.includes('username')) {
      throw {
        statusCode: 409,
        message: 'Username is already taken',
      }
    }

    if (target.includes('accessKeyId')) {
      throw {
        statusCode: 409,
        message: 'Access key collision detected. Please try again.',
      }
    }
  }

  throw error
}

export function signAdminToken(app: FastifyInstance) {
  return app.jwt.sign(
    {
      sub: 'relay-admin',
      username: process.env.ADMIN_DISPLAY_NAME || 'Admin',
      scope: 'admin',
    },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

export async function loginAdmin(input: AdminLoginInput, app: FastifyInstance) {
  const expectedKey = process.env.ADMIN_ACCESS_KEY?.trim()
  if (!expectedKey) {
    throw {
      statusCode: 500,
      message: 'ADMIN_ACCESS_KEY is not configured',
    }
  }

  if (input.accessKey.trim() !== expectedKey) {
    throw { statusCode: 401, message: 'Invalid admin key' }
  }

  return {
    user: {
      id: 'relay-admin',
      username: process.env.ADMIN_DISPLAY_NAME || 'Admin',
    },
    accessToken: signAdminToken(app),
  }
}

export async function getAdminOverview() {
  const server = await ensurePrimaryServer()
  const [members, channels, messages] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count({ where: { serverId: server.id } }),
    prisma.message.count(),
  ])

  return {
    server,
    stats: {
      members,
      channels,
      messages,
    },
  }
}

export async function getAdminServer() {
  return getPrimaryServer()
}

export async function saveAdminServer(data: UpdateServerInput) {
  return updatePrimaryServer(data)
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      accessKeyId: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })
}

export async function createAdminUser(data: CreateAdminUserInput) {
  const accessKeyId = await generateUniqueAccessKeyId()
  const accessSecret = generateTokenPart(24)
  const passwordHash = await bcrypt.hash(accessSecret, 10)

  let user

  try {
    user = await prisma.user.create({
      data: {
        accessKeyId,
        username: data.username,
        email: data.email ?? null,
        avatar: data.avatar ?? null,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        accessKeyId: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })
  } catch (error) {
    throwUserConflict(error)
  }

  return {
    user,
    accessKey: formatAccessKey(accessKeyId, accessSecret),
  }
}

export async function regenerateUserAccessKey(userId: string) {
  const accessKeyId = await generateUniqueAccessKeyId()
  const accessSecret = generateTokenPart(24)
  const passwordHash = await bcrypt.hash(accessSecret, 10)

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accessKeyId,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      accessKeyId: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })

  return {
    user,
    accessKey: formatAccessKey(accessKeyId, accessSecret),
  }
}

export async function listAdminChannels() {
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })
}

async function getNextChannelPosition(serverId: string) {
  const result = await prisma.channel.aggregate({
    where: { serverId },
    _max: { position: true },
  })

  return (result._max.position ?? -1) + 1
}

export async function createAdminChannel(data: CreateChannelInput) {
  const server = await ensurePrimaryServer()
  const position = await getNextChannelPosition(server.id)

  return prisma.channel.create({
    data: {
      serverId: server.id,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      position,
    },
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

export async function updateAdminChannel(id: string, data: UpdateChannelInput) {
  return prisma.channel.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      ...(typeof data.position === 'number' ? { position: data.position } : {}),
    },
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

export async function deleteAdminChannel(id: string) {
  await prisma.channel.delete({ where: { id } })
}
