import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const MESSAGE_PAGE_SIZE = 50

const messageInclude = {
  author: {
    select: { id: true, username: true, avatar: true },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      author: {
        select: { id: true, username: true, avatar: true },
      },
    },
  },
} satisfies Prisma.MessageInclude

export interface MessagePage {
  items: Awaited<ReturnType<typeof createMessage>>[]
  nextCursor: string | null
  hasMore: boolean
}

export async function getMessages(channelId: string, cursor?: string) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    take: MESSAGE_PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: messageInclude,
  })

  const hasMore = messages.length > MESSAGE_PAGE_SIZE
  const pageItems = hasMore ? messages.slice(0, MESSAGE_PAGE_SIZE) : messages
  const orderedItems = pageItems.reverse()

  return {
    items: orderedItems,
    nextCursor: hasMore ? orderedItems[0]?.id ?? null : null,
    hasMore,
  } satisfies MessagePage
}

export async function createMessage(data: {
  content: string
  channelId: string
  authorId: string
  replyToId?: string | null
}) {
  if (data.replyToId) {
    const replyTarget = await prisma.message.findUnique({
      where: { id: data.replyToId },
      select: {
        id: true,
        channelId: true,
      },
    })

    if (!replyTarget) {
      throw { statusCode: 404, message: 'Reply target not found' }
    }

    if (replyTarget.channelId !== data.channelId) {
      throw { statusCode: 400, message: 'Reply target must be in the same channel' }
    }
  }

  return prisma.message.create({
    data,
    include: messageInclude,
  })
}

export async function editMessage(id: string, content: string, authorId: string) {
  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw { statusCode: 404, message: 'Message not found' }
  if (message.authorId !== authorId) throw { statusCode: 403, message: 'Forbidden' }

  return prisma.message.update({
    where: { id },
    data: { content, edited: true },
    include: messageInclude,
  })
}

export async function deleteMessage(id: string, authorId: string) {
  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw { statusCode: 404, message: 'Message not found' }
  if (message.authorId !== authorId) throw { statusCode: 403, message: 'Forbidden' }

  return prisma.message.delete({ where: { id } })
}
