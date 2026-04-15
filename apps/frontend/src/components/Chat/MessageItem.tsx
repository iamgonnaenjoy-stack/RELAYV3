import { Message } from '@/stores/message.store'
import { format, isToday, isYesterday } from 'date-fns'
import clsx from 'clsx'
import { Pencil, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  message: Message
  isGrouped: boolean
  isOwnMessage: boolean
  isEditing: boolean
  editingValue: string
  actionBusy: boolean
  onStartEdit: () => void
  onEditingChange: (value: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onRetry: () => void
}

function formatTime(date: string) {
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, yyyy h:mm a')
}

function shortTime(date: string) {
  return format(new Date(date), 'h:mm a')
}

// Deterministic color per username
const AVATAR_COLORS = ['#818CF8', '#5865F2', '#3BA55D', '#FAA61A', '#ED4245', '#06B6D4']
function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function MessageItem({
  message,
  isGrouped,
  isOwnMessage,
  isEditing,
  editingValue,
  actionBusy,
  onStartEdit,
  onEditingChange,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onRetry,
}: Props) {
  const color = avatarColor(message.author.username)
  const canSaveEdit = editingValue.trim().length > 0 && editingValue.trim() !== message.content

  return (
    <div
      className={clsx(
        'group flex items-start gap-4 px-4 transition-colors duration-100 hover:bg-[#0F1115]',
        isGrouped ? 'py-0.5' : 'pt-4 pb-0.5'
      )}
    >
      <div className="w-9 flex-shrink-0 flex justify-center">
        {isGrouped ? (
          <span className="text-[10px] text-[#4B5563] opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-1 select-none">
            {shortTime(message.createdAt)}
          </span>
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: color + '22', border: `1px solid ${color}33`, color }}
          >
            {message.author.username[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="cursor-pointer text-sm font-semibold text-white hover:underline"
              style={{ color }}
            >
              {message.author.username}
            </span>
            <span className="text-[#4B5563] text-[11px]">{formatTime(message.createdAt)}</span>
            {message.edited && (
              <span className="text-[#4B5563] text-[11px]">(edited)</span>
            )}
          </div>
        )}

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
            <p className="break-words text-sm leading-relaxed text-[#A1A6B3]">{message.content}</p>

            {(message.pending || message.failed) && (
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
            )}
          </>
        )}
      </div>

      {isOwnMessage && !message.pending && !isEditing ? (
        <div className="pointer-events-none mt-1 flex shrink-0 items-center gap-1 rounded-btn border border-border bg-bg-surface p-1 opacity-0 shadow-elevation transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          {!message.failed ? (
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
          <button
            type="button"
            onClick={onDelete}
            disabled={actionBusy}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-text-disabled transition-colors duration-150 hover:bg-[rgba(237,66,69,0.1)] hover:text-error"
            title="Delete message"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
