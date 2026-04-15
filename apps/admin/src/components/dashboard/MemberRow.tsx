import { KeyRound } from 'lucide-react'
import { AdminMember } from '@/lib/types'

interface MemberRowProps {
  member: AdminMember
  isLast: boolean
  submitting: boolean
  onReset: (userId: string) => void
  relativeDate: (value: string | null) => string
}

export default function MemberRow({
  member,
  isLast,
  submitting,
  onReset,
  relativeDate,
}: MemberRowProps) {
  return (
    <div className={`px-4 py-4 ${isLast ? '' : 'border-b border-border-soft'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-bg-elevated text-xs font-semibold uppercase text-text-secondary">
              {member.username.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{member.username}</p>
              <p className="truncate text-xs text-text-secondary">
                {member.email ?? 'No email stored'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            <span>key {member.accessKeyId}</span>
            <span>{member._count?.messages ?? 0} messages</span>
            <span>last login {relativeDate(member.lastLoginAt)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReset(member.id)}
          disabled={submitting}
          className="secondary-button h-9 gap-2 px-3"
        >
          <KeyRound size={14} />
          Reset key
        </button>
      </div>
    </div>
  )
}
