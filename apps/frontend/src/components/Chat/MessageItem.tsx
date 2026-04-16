import type { Message } from '@/stores/message.store'
import { format, isToday, isYesterday } from 'date-fns'
import clsx from 'clsx'
import { Check, Copy, Pencil, Reply, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  message: Message
  isGrouped: boolean
  isOwnMessage: boolean
  isEditing: boolean
  editingValue: string
  actionBusy: boolean
  copied: boolean
  isReplying: boolean
  isHighlighted: boolean
  onStartEdit: () => void
  onEditingChange: (value: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onCopy: () => void
  onReply: () => void
  onJumpToReply: () => void
  onOpenAuthorProfile: () => void
  onOpenReplyAuthorProfile: () => void
  onDelete: () => void
  onRetry: () => void
}

function formatTime(date: string) {
  const parsed = new Date(date)
  if (isToday(parsed)) return `Today at ${format(parsed, 'h:mm a')}`
  if (isYesterday(parsed)) return `Yesterday at ${format(parsed, 'h:mm a')}`
  return format(parsed, 'MMM d, yyyy h:mm a')
}

function shortTime(date: string) {
  return format(new Date(date), 'h:mm a')
}

const AVATAR_COLORS = ['#818CF8', '#5865F2', '#3BA55D', '#FAA61A', '#ED4245', '#06B6D4']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Avatar({
  user,
  size,
  color,
}: {
  user: Message['author']
  size: 16 | 40
  color: string
}) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={clsx(
          'shrink-0 rounded-full object-cover',
          size === 16 ? 'h-4 w-4' : 'h-10 w-10'
        )}
      />
    )
  }

  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full border font-semibold',
        size === 16 ? 'h-4 w-4 text-[9px]' : 'h-10 w-10 text-xs'
      )}
      style={{ background: `${color}22`, borderColor: `${color}33`, color }}
    >
      {user.username[0]?.toUpperCase()}
    </span>
  )
}

export default function MessageItem({
  message,
  isGrouped,
  isOwnMessage,
  isEditing,
  editingValue,
  actionBusy,
  copied,
  isReplying,
  isHighlighted,
  onStartEdit,
  onEditingChange,
  onCancelEdit,
  onSaveEdit,
  onCopy,
  onReply,
  onJumpToReply,
  onOpenAuthorProfile,
  onOpenReplyAuthorProfile,
  onDelete,
  onRetry,
}: Props) {
  const color = avatarColor(message.author.username)
  const replyColor = message.replyTo ? avatarColor(message.replyTo.author.username) : null
  const showGroupedLayout = isGrouped && !message.replyTo
  const canSaveEdit = editingValue.trim().length > 0 && editingValue.trim() !== message.content
  const canReply = !message.pending && !message.failed
  const canEdit = isOwnMessage && !message.pending && !message.failed
  const canDelete = isOwnMessage && !message.pending
  const showToolbar = !isEditing && !message.pending

  return (
    <div
      id={`message-${message.id}`}
      className={clsx(
        'group flex items-start gap-4 px-4 transition-colors duration-150 hover:bg-[var(--bg-message-hover)]',
        isHighlighted && 'bg-[var(--bg-message-highlight)]',
        showGroupedLayout ? 'py-0.5' : 'pt-0.5 pb-0.5'
      )}
    >
      <div className="relative z-10 flex w-10 shrink-0 justify-center pt-0.5">
        {showGroupedLayout ? (
          <span className="mt-1 select-none text-[12px] text-text-disabled opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {shortTime(message.createdAt)}
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthorProfile}
            className="rounded-full focus-visible:shadow-none"
            title={`Open ${message.author.username}'s profile`}
          >
            <Avatar user={message.author} size={40} color={color} />
          </button>
        )}
      </div>

      <div className="relative z-0 min-w-0 flex-1 pb-0.5">
        {message.replyTo ? (
          <div className="relative mb-1 h-[22px]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[-36px] top-[11px] z-0 h-[11px] w-[33px] rounded-tl-[6px] border-l-2 border-t-2 border-[var(--reply-connector)]"
            />
            <div
              role="button"
              tabIndex={0}
              onClick={onJumpToReply}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onJumpToReply()
                }
              }}
              className="group/reply relative z-10 flex h-[22px] w-full max-w-full cursor-pointer items-center gap-1.5 overflow-hidden text-left text-[14px] leading-[20px] text-[var(--text-reply-preview)] opacity-[0.64] transition-all duration-150 hover:text-[var(--text-reply-preview-hover)] hover:opacity-100 focus-visible:shadow-none"
              title="Jump to referenced message"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenReplyAuthorProfile()
                }}
                className="rounded-full focus-visible:shadow-none"
                tabIndex={-1}
                title={`Open ${message.replyTo.author.username}'s profile`}
              >
                <Avatar
                  user={message.replyTo.author}
                  size={16}
                  color={replyColor ?? color}
                />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenReplyAuthorProfile()
                }}
                className="shrink-0 truncate font-medium text-text-primary transition-colors duration-150 group-hover/reply:underline focus-visible:shadow-none"
                tabIndex={-1}
                title={`Open ${message.replyTo.author.username}'s profile`}
              >
                {message.replyTo.author.username}
              </button>
              <span className="min-w-0 max-w-[160px] truncate">
                {message.replyTo.content}
              </span>
            </div>
          </div>
        ) : null}

        <div className="min-h-[44px] pt-0.5">
          <div className="min-w-0">
            {!showGroupedLayout ? (
              <div className="mb-0.5 flex items-baseline gap-2">
                <button
                  type="button"
                  onClick={onOpenAuthorProfile}
                  className="text-sm font-semibold text-text-primary hover:underline focus-visible:shadow-none"
                  title={`Open ${message.author.username}'s profile`}
                >
                  {message.author.username}
                </button>
                <span className="text-[12px] text-text-muted">{formatTime(message.createdAt)}</span>
              </div>
            ) : null}

            {isEditing ? (
              <div className="max-w-[720px]">
                <textarea
                  className="w-full resize-none overflow-y-auto rounded-input border border-border bg-bg-elevated px-3 py-2.5 text-sm leading-6 text-text-primary outline-none transition-colors duration-150 focus:border-accent"
                  value={editingValue}
                  rows={Math.min(Math.max(editingValue.split('\n').length, 1), 8)}
                  onChange={(event) => onEditingChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      onCancelEdit()
                    }

                    if (event.key === 'Enter' && !event.shiftKey && canSaveEdit) {
                      event.preventDefault()
                      onSaveEdit()
                    }
                  }}
                  autoFocus
                />
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
                  <span>escape to</span>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary focus-visible:shadow-none"
                  >
                    cancel
                  </button>
                  <span>&bull; enter to</span>
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    disabled={!canSaveEdit || actionBusy}
                    className="font-medium text-accent transition-colors duration-150 hover:text-text-primary focus-visible:shadow-none disabled:cursor-not-allowed disabled:text-text-disabled"
                  >
                    save
                  </button>
                  <span>&bull; shift + enter for a new line</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="break-words text-[16px] leading-[22px] text-text-primary">
                    {message.content}
                  </p>
                  {message.edited ? (
                    <span className="text-[11px] text-text-muted">(edited)</span>
                  ) : null}
                </div>

                {message.pending || message.failed ? (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    {message.pending ? (
                      <span className="text-text-disabled">Sending...</span>
                    ) : (
                      <>
                        <span className="text-error">Failed to send</span>
                        <button
                          type="button"
                          onClick={onRetry}
                          className="inline-flex items-center gap-1 text-text-secondary transition-colors duration-150 hover:text-text-primary focus-visible:shadow-none"
                        >
                          <RotateCcw size={11} />
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {showToolbar ? (
        <div
          className={clsx(
            'pointer-events-none flex shrink-0 items-center gap-1 rounded-btn border border-border bg-bg-surface p-1 opacity-0 shadow-elevation transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100',
            message.replyTo ? 'mt-7' : 'mt-1'
          )}
        >
          {canReply ? (
            <button
              type="button"
              onClick={onReply}
              disabled={actionBusy}
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors duration-150 focus-visible:shadow-none',
                isReplying
                  ? 'bg-bg-hover text-accent'
                  : 'text-text-disabled hover:bg-bg-hover hover:text-text-primary'
              )}
              title="Reply"
            >
              <Reply size={13} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCopy}
            disabled={actionBusy}
            className={clsx(
              'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors duration-150 focus-visible:shadow-none',
              copied
                ? 'bg-bg-hover text-accent'
                : 'text-text-disabled hover:bg-bg-hover hover:text-text-primary'
            )}
            title={copied ? 'Copied' : 'Copy message'}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {canEdit ? (
            <button
              type="button"
              onClick={onStartEdit}
              disabled={actionBusy}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-disabled transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary focus-visible:shadow-none"
              title="Edit message"
            >
              <Pencil size={13} />
            </button>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={actionBusy}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-disabled transition-colors duration-150 hover:bg-[rgba(237,66,69,0.1)] hover:text-error focus-visible:shadow-none"
              title="Delete message"
            >
              <Trash2 size={13} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
