import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  disableFutureLabel?: string
  disableFutureChecked?: boolean
  busy?: boolean
  onDisableFutureChange?: (checked: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  disableFutureLabel,
  disableFutureChecked = false,
  busy = false,
  onDisableFutureChange,
  onCancel,
  onConfirm,
}: Props) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      cancelButtonRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [busy, onCancel, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[rgba(0,0,0,0.78)] backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) {
            onCancel()
          }
        }}
      />

      <div className="relative z-[1] w-full max-w-[440px] overflow-hidden rounded-card border border-border bg-bg-surface shadow-elevation">
        <div className="flex items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={clsx(
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                tone === 'danger'
                  ? 'border-[rgba(237,66,69,0.3)] bg-[rgba(237,66,69,0.08)] text-error'
                  : 'border-border bg-bg-elevated text-text-secondary'
              )}
            >
              <AlertTriangle size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-text-disabled transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {disableFutureLabel ? (
          <label className="flex items-center gap-3 border-b border-divider px-5 py-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={disableFutureChecked}
              onChange={(event) => onDisableFutureChange?.(event.target.checked)}
              className="h-4 w-4 rounded-[4px] border border-border bg-bg-elevated accent-[var(--accent)]"
            />
            <span>{disableFutureLabel}</span>
          </label>
        ) : null}

        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-ghost px-3.5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={clsx(
              'inline-flex items-center justify-center rounded-btn px-3.5 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
              tone === 'danger'
                ? 'bg-error text-white hover:opacity-90'
                : 'bg-accent text-white hover:bg-accent-hover'
            )}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
