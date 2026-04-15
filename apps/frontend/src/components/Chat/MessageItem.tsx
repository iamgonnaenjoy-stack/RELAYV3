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
  onStartEdit: () => void
  onEditingChange: (value: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onCopy: () => void
  onReply: () => void
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
  onStartEdit,
  onEditingChange,
  onCancelEdit,
  onSaveEdit,
  onCopy,
  onReply,
  onDelete,
  onRetry,
}: Props) {
  const color = avatarColor(message.author.username)
  const canSaveEdit = editingValue.trim().length > 0 && editingValue.trim() !== message.content
  const canReply = !message.pending && !message.failed
  const canEdit = isOwnMessage && !message.pending && !message.failed
  const canDelete = isOwnMessage && !message.pending
  const showToolbar = !isEditing && !message.pending

  return (
    <div
      className={clsx(
        'group flex items-start gap-4 px-4 transition-colors duration-100 hover:bg-bg-hover',
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
          <div className="surface mt-1 p-3">
            <textarea
              className="min-h-[88px] w-full resize-y bg-transparent text-sm leading-6 text-text-primary outline-none"
              value={editingValue}
              onChange={(event) => onEditingChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onCancelEdit()
                }

                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSaveEdit) {
                  event.preventDefault()
                  onSaveEdit()
                }
              }}
              autoFocus
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-text-disabled">
                Press escape to cancel, or save the updated message.
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onCancelEdit} className="btn-ghost px-3 py-1.5 text-xs">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  disabled={!canSaveEdit || actionBusy}
                  className="btn-primary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {message.replyTo ? (
              <div className="mb-1.5 flex max-w-[560px] min-w-0 items-center gap-2 overflow-hidden rounded-input border border-border bg-bg-surface px-2.5 py-1.5 text-xs text-text-muted">
                <Reply size={11} className="shrink-0 text-accent" />
                <span className="shrink-0 font-medium text-text-secondary">
                  {message.replyTo.author.username}
                </span>
                <span className="min-w-0 truncate">{message.replyTo.content}</span>
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
