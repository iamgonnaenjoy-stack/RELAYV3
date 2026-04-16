import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface ProfileUser {
  id: string
  username: string
  avatar: string | null
}

interface Props {
  user: ProfileUser | null
  open: boolean
  onClose: () => void
}

const AVATAR_COLORS = ['#818CF8', '#5865F2', '#3BA55D', '#FAA61A', '#ED4245', '#06B6D4']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function UserProfileDialog({ user, open, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open || !user) {
    return null
  }

  const color = avatarColor(user.username)

  return createPortal(
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close profile"
        className="absolute inset-0 bg-[rgba(0,0,0,0.78)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-[1] w-full max-w-[360px] overflow-hidden rounded-card border border-border bg-bg-surface shadow-elevation">
        <div className="flex items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Member
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">{user.username}</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-text-disabled transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-xl font-semibold"
                style={{ background: `${color}22`, borderColor: `${color}33`, color }}
              >
                {user.username[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-base font-semibold text-text-primary">{user.username}</p>
              <p className="mt-1 break-all text-sm text-text-secondary">ID: {user.id}</p>
            </div>
          </div>

          <div className="mt-5 rounded-input border border-divider bg-bg-elevated px-3.5 py-3 text-sm leading-6 text-text-secondary">
            More member profile details can expand here later. For now, Relay opens a clean member card instead of leaving avatar and name clicks dead.
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
