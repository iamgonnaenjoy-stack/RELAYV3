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
  onDelete,
  onRetry,
}: Props) {
  const color = avatarColor(message.author.username)
  const replyColor = message.replyTo ? avatarColor(message.replyTo.author.username) : null
  const canSaveEdit = editingValue.trim().length > 0 && editingValue.trim() !== message.content
  const canReply = !message.pending && !message.failed
  const canEdit = isOwnMessage && !message.pending && !message.failed
  const canDelete = isOwnMessage && !message.pending
  const showToolbar = !isEditing && !message.pending

  return (
    <div
      id={`message-${message.id}`}
      className={clsx(
        'group flex items-start gap-4 px-4 transition-colors duration-100 hover:bg-bg-hover',
        isHighlighted && 'bg-[var(--accent-soft)]',
        isGrouped ? 'py-0.5' : 'pt-4 pb-0.5'
      )}
    >
      <div className="flex w-9 shrink-0 justify-center">
        {isGrouped ? (
          <span className="mt-1 select-none text-[10px] text-text-disabled opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {shortTime(message.createdAt)}
          </span>
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
            style={{ background: `${color}22`, borderColor: `${color}33`, color }}
          >
            {message.author.username[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!isGrouped ? (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="cursor-pointer text-sm font-semibold text-text-primary hover:underline">
              {message.author.username}
            </span>
            <span className="text-[11px] text-text-disabled">{formatTime(message.createdAt)}</span>
          </div>
        ) : null}

        {isEditing ? (
          <div className="mt-1 max-w-[720px]">
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
                className="font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
              >
                cancel
              </button>
              <span>• enter to</span>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={!canSaveEdit || actionBusy}
                className="font-medium text-accent transition-colors duration-150 hover:text-text-primary disabled:cursor-not-allowed disabled:text-text-disabled"
              >
                save
              </button>
              <span>• shift + enter for a new line</span>
            </div>
          </div>
        ) : (
          <>
            {message.replyTo ? (
              <div className="relative mb-1.5 pl-7">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[9px] h-3.5 w-4 rounded-tl-[var(--radius-btn)] border-l border-t border-divider"
                />
                <button
                  type="button"
                  onClick={onJumpToReply}
                  className="flex max-w-full items-center gap-1.5 text-left text-xs text-text-muted opacity-70 transition-opacity duration-150 hover:opacity-100"
                  title="Jump to referenced message"
                >
                  {message.replyTo.author.avatar ? (
                    <img
                      src={message.replyTo.author.avatar}
                      alt={message.replyTo.author.username}
                      className="h-4 w-4 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold"
                      style={{
                        background: `${replyColor ?? color}22`,
                        borderColor: `${replyColor ?? color}33`,
                        color: replyColor ?? color,
                      }}
                    >
                      {message.replyTo.author.username[0].toUpperCase()}
                    </span>
                  )}
                  <span className="shrink-0 font-medium text-text-primary">
                    {message.replyTo.author.username}
                  </span>
                  <span className="min-w-0 truncate">{message.replyTo.content}</span>
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-1.5">
              <p className="break-words text-sm leading-relaxed text-text-secondary">{message.content}</p>
              {message.edited ? (
                <span className="text-[11px] text-text-disabled">(edited)</span>
              ) : null}
            </div>

            {(message.pending || message.failed) ? (
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                {message.pending ? (
                  <span className="text-text-disabled">Sending...</span>
                ) : (
                  <>
                    <span className="text-error">Failed to send</span>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1 text-text-secondary transition-colors duration-150 hover:text-text-primary"
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

      {showToolbar ? (
        <div className="pointer-events-none mt-1 flex shrink-0 items-center gap-1 rounded-btn border border-border bg-bg-surface p-1 opacity-0 shadow-elevation transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          {canReply ? (
            <button
              type="button"
              onClick={onReply}
              disabled={actionBusy}
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors duration-150',
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
              'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors duration-150',
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
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-disabled transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
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
              className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-disabled transition-colors duration-150 hover:bg-[rgba(237,66,69,0.1)] hover:text-error"
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
