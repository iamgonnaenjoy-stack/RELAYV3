import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { LoginInput } from './auth.schema'
import { FastifyInstance } from 'fastify'

const ACCESS_KEY_PREFIX = 'relay_'

export async function loginUser(input: LoginInput, app: FastifyInstance) {
  const parsed = parseAccessKey(input.accessKey)
  if (!parsed) {
    throw { statusCode: 401, message: 'Invalid access key' }
  }

  const user = await prisma.user.findUnique({ where: { accessKeyId: parsed.accessKeyId } })

  if (!user) {
    throw { statusCode: 401, message: 'Invalid access key' }
  }

  const valid = await bcrypt.compare(parsed.secret, user.passwordHash)
  if (!valid) {
    throw { statusCode: 401, message: 'Invalid access key' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const accessToken = signMemberToken(app, user.id, user.username)

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    accessToken,
  }
}

export function signMemberToken(app: FastifyInstance, userId: string, username: string) {
  return app.jwt.sign(
    { sub: userId, username, scope: 'member' },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  })

  if (!user) throw { statusCode: 404, message: 'User not found' }
  return user
}

function parseAccessKey(accessKey: string) {
  const trimmed = accessKey.trim()
  if (!trimmed.startsWith(ACCESS_KEY_PREFIX)) {
    return null
  }

  const rawKey = trimmed.slice(ACCESS_KEY_PREFIX.length)
  const separatorIndex = rawKey.indexOf('.')
  if (separatorIndex <= 0 || separatorIndex === rawKey.length - 1) {
    return null
  }

  return {
    accessKeyId: rawKey.slice(0, separatorIndex),
    secret: rawKey.slice(separatorIndex + 1),
  }
}
