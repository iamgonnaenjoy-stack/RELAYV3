import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Hash, Volume2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Message, useMessageStore } from '@/stores/message.store'
import { useChannelStore } from '@/stores/channel.store'
import { usePreferencesStore } from '@/stores/preferences.store'
import { useShellStore } from '@/stores/shell.store'
import { messageApi } from '@/lib/services'
import { emitTypingStop, joinChannel, leaveChannel, sendSocketMessage } from '@/lib/socket'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import TypingIndicator from './TypingIndicator'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Skeleton from '@/components/ui/Skeleton'
import UserProfileDialog, { type ProfileUser } from '@/components/ui/UserProfileDialog'

const EMPTY_CHANNEL_STATE = {
  items: [],
  hasLoaded: false,
  isLoading: false,
  isLoadingOlder: false,
  hasMore: false,
  nextCursor: null,
  error: null,
  typingUsers: [],
} satisfies ReturnType<typeof useMessageStore.getState>['channels'][string]

function ChatAreaSkeleton() {
  return (
    <div className="route-shell flex h-full flex-col bg-bg">
      <div className="flex h-12 items-center gap-3 border-b border-divider px-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="hidden h-3 w-40 sm:block" />
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden px-4 py-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-start gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-full max-w-[520px]" />
              <Skeleton className="h-4 w-[72%] max-w-[420px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-5">
        <Skeleton className="h-[52px] w-full rounded-[10px]" />
      </div>
    </div>
  )
}

function CenterState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="route-shell flex h-full flex-1 items-center justify-center px-6">
      <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg-surface">
          {icon}
        </div>
        <p className="text-lg font-semibold text-text-primary">{title}</p>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
        {action}
      </div>
    </div>
  )
}

function buildClientId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function shouldGroupMessages(previous: Message | undefined, current: Message) {
  if (!previous || previous.author.id !== current.author.id) {
    return false
  }

  if (previous.pending || current.pending || previous.failed || current.failed) {
    return true
  }

  const previousTime = new Date(previous.createdAt).getTime()
  const currentTime = new Date(current.createdAt).getTime()

  if (Number.isNaN(previousTime) || Number.isNaN(currentTime)) {
    return true
  }

  return Math.abs(currentTime - previousTime) < 5 * 60 * 1000
}

type ReplyTarget = Pick<Message, 'id' | 'content' | 'author'>

export default function ChatArea() {
  const { channelId } = useParams<{ channelId: string }>()
  const user = useAuthStore((state) => state.user)
  const channels = useChannelStore((s) => s.channels)
  const channelsLoading = useChannelStore((s) => s.loading)
  const markChannelRead = useChannelStore((state) => state.markChannelRead)
  const channelState = useMessageStore((state) =>
    channelId ? state.channels[channelId] ?? EMPTY_CHANNEL_STATE : EMPTY_CHANNEL_STATE
  )
  const startInitialLoad = useMessageStore((state) => state.startInitialLoad)
  const finishInitialLoad = useMessageStore((state) => state.finishInitialLoad)
  const failInitialLoad = useMessageStore((state) => state.failInitialLoad)
  const startLoadingOlder = useMessageStore((state) => state.startLoadingOlder)
  const finishLoadingOlder = useMessageStore((state) => state.finishLoadingOlder)
  const failLoadingOlder = useMessageStore((state) => state.failLoadingOlder)
  const addOptimisticMessage = useMessageStore((state) => state.addOptimisticMessage)
  const reconcileIncomingMessage = useMessageStore((state) => state.reconcileIncomingMessage)
  const markMessageFailed = useMessageStore((state) => state.markMessageFailed)
  const updateMessage = useMessageStore((state) => state.updateMessage)
  const removeMessage = useMessageStore((state) => state.deleteMessage)
  const clearTypingUsers = useMessageStore((state) => state.clearTypingUsers)
  const confirmMessageDelete = usePreferencesStore((state) => state.confirmMessageDelete)
  const setConfirmMessageDelete = usePreferencesStore((state) => state.setConfirmMessageDelete)
  const connectionStatus = useShellStore((state) => state.connectionStatus)
  const channel = channels.find((c) => c.id === channelId)
  const isTextChannel = channel?.type === 'TEXT'
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [messagePendingDelete, setMessagePendingDelete] = useState<Message | null>(null)
  const [skipDeletePrompt, setSkipDeletePrompt] = useState(false)
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastChannelIdRef = useRef<string | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const restoreScrollOffsetRef = useRef<number | null>(null)
  const loadingOlderRef = useRef(false)
  const copiedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const messages = channelState.items
  const hasLoadedMessages = channelState.hasLoaded
  const typingUsers = useMemo(
    () => channelState.typingUsers.filter((username) => username !== user?.username),
    [channelState.typingUsers, user?.username]
  )

  const loadMessages = useCallback(async () => {
    if (!channelId) return

    startInitialLoad(channelId)
    try {
      const response = await messageApi.getByChannel(channelId)
      finishInitialLoad(channelId, response.data)
      markChannelRead(channelId)
    } catch (error: any) {
      failInitialLoad(
        channelId,
        error.response?.data?.error ?? 'Unable to load messages for this channel.'
      )
    }
  }, [channelId, failInitialLoad, finishInitialLoad, markChannelRead, startInitialLoad])

  const loadOlderMessages = useCallback(async () => {
    if (
      !channelId ||
      !channelState.nextCursor ||
      !channelState.hasMore ||
      channelState.isLoadingOlder ||
      loadingOlderRef.current
    ) {
      return
    }

    loadingOlderRef.current = true
    const scroller = scrollRef.current
    if (scroller) {
      restoreScrollOffsetRef.current = scroller.scrollHeight - scroller.scrollTop
    }

    startLoadingOlder(channelId)
    try {
      const response = await messageApi.getByChannel(channelId, channelState.nextCursor)
      finishLoadingOlder(channelId, response.data)
    } catch (error: any) {
      failLoadingOlder(
        channelId,
        error.response?.data?.error ?? 'Unable to load older messages.'
      )
    } finally {
      loadingOlderRef.current = false
    }
  }, [
    channelId,
    channelState.hasMore,
    channelState.isLoadingOlder,
    channelState.nextCursor,
    failLoadingOlder,
    finishLoadingOlder,
    startLoadingOlder,
  ])

  const sendMessage = useCallback(
    async (content: string, replyTarget?: ReplyTarget | null) => {
      if (!channelId || !user) {
        throw new Error('Missing channel context')
      }

      const clientId = buildClientId()
      addOptimisticMessage(channelId, {
        id: `temp-${clientId}`,
        channelId,
        clientId,
        content,
        createdAt: new Date().toISOString(),
        edited: false,
        pending: true,
        failed: false,
        author: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        replyTo: replyTarget
          ? {
              id: replyTarget.id,
              content: replyTarget.content,
              author: replyTarget.author,
            }
          : null,
      })

      const response = await sendSocketMessage({
        channelId,
        content,
        clientId,
        replyToId: replyTarget?.id ?? null,
      })

      if (!response.ok) {
        markMessageFailed(channelId, clientId)
        setActionError(response.error)
        throw new Error(response.error)
      }

      reconcileIncomingMessage(channelId, response.message)
      setActionError(null)
    },
    [addOptimisticMessage, channelId, markMessageFailed, reconcileIncomingMessage, user]
  )

  const handleSendMessage = useCallback(
    async (content: string) => {
      const activeReply = replyingTo
      await sendMessage(content, activeReply)
      setReplyingTo(null)
    },
    [replyingTo, sendMessage]
  )

  useEffect(() => {
    if (!channelId || !isTextChannel) return

    joinChannel(channelId)
    clearTypingUsers(channelId)
    void loadMessages()

    return () => {
      leaveChannel(channelId)
      emitTypingStop(channelId)
      clearTypingUsers(channelId)
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current)
        copiedMessageTimeoutRef.current = null
      }
      if (highlightedMessageTimeoutRef.current) {
        clearTimeout(highlightedMessageTimeoutRef.current)
        highlightedMessageTimeoutRef.current = null
      }
      setEditingMessageId(null)
      setEditingValue('')
      setReplyingTo(null)
      setCopiedMessageId(null)
      setHighlightedMessageId(null)
      setMessagePendingDelete(null)
      setSkipDeletePrompt(false)
      setProfileUser(null)
      setActionError(null)
    }
  }, [channelId, clearTypingUsers, isTextChannel, loadMessages])

  useEffect(
    () => () => {
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current)
      }
      if (highlightedMessageTimeoutRef.current) {
        clearTimeout(highlightedMessageTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller || !channelId) return

    if (restoreScrollOffsetRef.current !== null) {
      scroller.scrollTop = scroller.scrollHeight - restoreScrollOffsetRef.current
      restoreScrollOffsetRef.current = null
      lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null
      return
    }

    const latestMessageId = messages[messages.length - 1]?.id ?? null
    const channelChanged = lastChannelIdRef.current !== channelId

    if (channelChanged) {
      lastChannelIdRef.current = channelId
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      })
    } else if (latestMessageId && latestMessageId !== lastMessageIdRef.current) {
      const distanceFromBottom =
        scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
      const latestMessage = messages[messages.length - 1]

      if (
        distanceFromBottom < 120 ||
        latestMessage?.author.id === user?.id ||
        latestMessage?.pending
      ) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({
            behavior: latestMessage?.pending ? 'auto' : 'smooth',
          })
        })
      }
    }

    lastMessageIdRef.current = latestMessageId
  }, [channelId, messages, user?.id])

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    if (event.currentTarget.scrollTop <= 96) {
      void loadOlderMessages()
    }
  }

  function handleStartEdit(messageId: string, content: string) {
    setReplyingTo(null)
    setEditingMessageId(messageId)
    setEditingValue(content)
    setActionError(null)
  }

  function handleCancelEdit() {
    setEditingMessageId(null)
    setEditingValue('')
  }

  function handleReplyToMessage(message: Message) {
    if (message.pending || message.failed) {
      return
    }

    setEditingMessageId(null)
    setEditingValue('')
    setReplyingTo(message)
    setActionError(null)
  }

  async function handleCopyMessage(message: Message) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = message.content
        textarea.setAttribute('readonly', 'true')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current)
      }

      setCopiedMessageId(message.id)
      copiedMessageTimeoutRef.current = setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current))
      }, 1600)
      setActionError(null)
    } catch {
      setActionError('Unable to copy this message right now.')
    }
  }

  function handleOpenProfile(user: ProfileUser) {
    setProfileUser(user)
  }

  function handleJumpToMessage(messageId: string) {
    const target = document.getElementById(`message-${messageId}`)
    if (!target) {
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedMessageId(messageId)

    if (highlightedMessageTimeoutRef.current) {
      clearTimeout(highlightedMessageTimeoutRef.current)
    }

    highlightedMessageTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current))
    }, 1500)
  }

  async function handleSaveEdit() {
    if (!channelId || !editingMessageId || editingValue.trim() === '') return

    setActionBusyId(editingMessageId)
    try {
      const response = await messageApi.edit(editingMessageId, editingValue.trim())
      updateMessage(channelId, response.data)
      setEditingMessageId(null)
      setEditingValue('')
      setActionError(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error ?? 'Unable to update this message.')
    } finally {
      setActionBusyId(null)
    }
  }

  async function performDeleteMessage(message: Message) {
    if (!channelId) {
      return
    }

    setActionBusyId(message.id)
    removeMessage(channelId, message.id)
    if (editingMessageId === message.id) {
      handleCancelEdit()
    }
    if (replyingTo?.id === message.id) {
      setReplyingTo(null)
    }

    if (messagePendingDelete?.id === message.id) {
      setMessagePendingDelete(null)
    }

    if (message.failed || message.id.startsWith('temp-')) {
      setActionBusyId(null)
      setActionError(null)
      return
    }

    try {
      await messageApi.delete(message.id)
      setActionError(null)
    } catch (error: any) {
      reconcileIncomingMessage(channelId, message)
      setActionError(error.response?.data?.error ?? 'Unable to delete this message.')
    } finally {
      setActionBusyId(null)
    }
  }

  function handleDeleteMessage(messageId: string) {
    const existingMessage = messages.find((message) => message.id === messageId)
    if (!existingMessage) {
      return
    }

    if (!confirmMessageDelete) {
      void performDeleteMessage(existingMessage)
      return
    }

    setSkipDeletePrompt(false)
    setMessagePendingDelete(existingMessage)
  }

  async function handleConfirmDelete() {
    if (!messagePendingDelete) {
      return
    }

    if (skipDeletePrompt) {
      setConfirmMessageDelete(false)
    }

    await performDeleteMessage(messagePendingDelete)
    setSkipDeletePrompt(false)
  }

  function handleCancelDelete() {
    setMessagePendingDelete(null)
    setSkipDeletePrompt(false)
  }

  async function handleRetryMessage(messageId: string) {
    if (!channelId) return

    const failedMessage = messages.find((message) => message.id === messageId)
    if (!failedMessage) return

    removeMessage(channelId, messageId)

    try {
      await sendMessage(failedMessage.content, failedMessage.replyTo ?? null)
    } catch {
      // Error state is already handled by sendMessage.
    }
  }

  if (channelsLoading && channelId) {
    return <ChatAreaSkeleton />
  }

  if (!channel) {
    return (
      <CenterState
        icon={<Hash size={24} className="text-text-disabled" />}
        title="Channel unavailable"
        description="Pick another channel from the sidebar to continue."
      />
    )
  }

  if (!isTextChannel) {
    return (
      <div className="route-shell flex h-full flex-col bg-bg">
        <ChatHeader channel={channel} />
        <CenterState
          icon={<Volume2 size={26} className="text-accent" />}
          title="Voice channels are coming soon"
          description={`#${channel.name} is ready in the server, but voice calling is still under construction.`}
        />
      </div>
    )
  }

  if (channelState.error && !hasLoadedMessages && !channelState.isLoading) {
    return (
      <div className="route-shell flex h-full flex-col bg-bg">
        <ChatHeader channel={channel} />
        <CenterState
          icon={<Hash size={24} className="text-text-disabled" />}
          title="Messages could not be loaded"
          description={channelState.error}
          action={
            <button type="button" onClick={() => void loadMessages()} className="btn-primary mt-2">
              Reload messages
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="route-shell flex h-full flex-col bg-bg">
      <ChatHeader channel={channel} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto pt-4"
      >
        {channelState.hasMore || channelState.isLoadingOlder || (channelState.error && hasLoadedMessages) ? (
          <div className="sticky top-0 z-10 flex justify-center px-4 pb-3">
            {channelState.isLoadingOlder ? (
              <div className="rounded-full border border-border bg-bg-surface px-3 py-1 text-xs text-text-muted">
                Loading older messages...
              </div>
            ) : channelState.error && hasLoadedMessages ? (
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                className="rounded-full border border-border bg-bg-surface px-3 py-1 text-xs text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
              >
                Retry loading older messages
              </button>
            ) : channelState.hasMore ? (
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                className="rounded-full border border-border bg-bg-surface px-3 py-1 text-xs text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
              >
                Load older messages
              </button>
            ) : null}
          </div>
        ) : null}

        {channelState.isLoading && !hasLoadedMessages ? (
          <div className="flex flex-col gap-5 px-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-start gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-[520px]" />
                  <Skeleton className="h-4 w-[70%] max-w-[420px]" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <CenterState
            icon={<Hash size={24} className="text-text-disabled" />}
            title={`Welcome to #${channel.name}`}
            description={`This is the beginning of #${channel.name}. Say hello when you're ready.`}
          />
        ) : (
          <div className="flex flex-col">
            {messages.map((msg, i) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwnMessage={msg.author.id === user?.id}
                isEditing={editingMessageId === msg.id}
                editingValue={editingMessageId === msg.id ? editingValue : msg.content}
                actionBusy={actionBusyId === msg.id}
                onStartEdit={() => handleStartEdit(msg.id, msg.content)}
                onEditingChange={setEditingValue}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={() => void handleSaveEdit()}
                onCopy={() => void handleCopyMessage(msg)}
                onReply={() => handleReplyToMessage(msg)}
                onDelete={() => handleDeleteMessage(msg.id)}
                onRetry={() => void handleRetryMessage(msg.id)}
                copied={copiedMessageId === msg.id}
                isReplying={replyingTo?.id === msg.id}
                isHighlighted={highlightedMessageId === msg.id}
                isGrouped={shouldGroupMessages(messages[i - 1], msg)}
                onJumpToReply={() => {
                  if (msg.replyTo) {
                    handleJumpToMessage(msg.replyTo.id)
                  }
                }}
                onOpenAuthorProfile={() => handleOpenProfile(msg.author)}
                onOpenReplyAuthorProfile={() => {
                  if (msg.replyTo) {
                    handleOpenProfile(msg.replyTo.author)
                  }
                }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {actionError ? (
        <div className="px-4 pb-2 text-xs text-error">{actionError}</div>
      ) : null}

      <TypingIndicator users={typingUsers} />
      <MessageInput
        channelId={channelId!}
        channelName={channel.name}
        disabled={connectionStatus !== 'connected'}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={handleSendMessage}
      />

      <ConfirmDialog
        open={!!messagePendingDelete}
        title="Delete message?"
        description="This will remove the message for everyone in this channel."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        disableFutureLabel="Don't ask next time"
        disableFutureChecked={skipDeletePrompt}
        busy={!!messagePendingDelete && actionBusyId === messagePendingDelete.id}
        onDisableFutureChange={setSkipDeletePrompt}
        onCancel={handleCancelDelete}
        onConfirm={() => void handleConfirmDelete()}
      />

      <UserProfileDialog
        user={profileUser}
        open={!!profileUser}
        onClose={() => setProfileUser(null)}
      />
    </div>
  )
}
