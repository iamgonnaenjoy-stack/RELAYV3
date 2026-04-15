import { KeyRound } from 'lucide-react'
import { AdminMember } from '@/lib/types'

interface MemberRowProps {
  member: AdminMember
  submitting: boolean
  onReset: (userId: string) => void
  relativeDate: (value: string | null) => string
}

export default function MemberRow({ member, submitting, onReset, relativeDate }: MemberRowProps) {
  return (
    <div className="rounded-panel border border-border bg-bg-elevated px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-black text-sm font-semibold uppercase text-text-primary">
              {member.username.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{member.username}</p>
              <p className="text-xs text-text-secondary">{member.email ?? 'No email'}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            <span className="rounded-full border border-border px-2 py-1">key {member.accessKeyId}</span>
            <span className="rounded-full border border-border px-2 py-1">
              {member._count.messages} messages
            </span>
            <span className="rounded-full border border-border px-2 py-1">
              last login {relativeDate(member.lastLoginAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReset(member.id)}
          disabled={submitting}
          className="secondary-button h-10 gap-2 px-3"
        >
          <KeyRound size={14} />
          Reset key
        </button>
      </div>
    </div>
  )
}
