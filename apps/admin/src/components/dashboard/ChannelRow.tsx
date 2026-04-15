import clsx from 'clsx'
import { Hash, Radio, Trash2 } from 'lucide-react'
import { AdminChannel } from '@/lib/types'

interface ChannelRowProps {
  channel: AdminChannel
  isLast: boolean
  submitting: boolean
  onDelete: (channelId: string) => void
}

export default function ChannelRow({ channel, isLast, submitting, onDelete }: ChannelRowProps) {
  return (
    <div className={`px-4 py-4 ${isLast ? '' : 'border-b border-border-soft'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-control',
                channel.type === 'VOICE'
                  ? 'bg-[#08110d] text-success'
                  : 'bg-[#0b1020] text-accent'
              )}
            >
              {channel.type === 'VOICE' ? <Radio size={15} /> : <Hash size={15} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">#{channel.name}</p>
              <p className="truncate text-xs text-text-secondary">
                {channel.description ?? 'No description'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
            <span>{channel.type}</span>
            <span>position {channel.position}</span>
            <span>{channel._count?.messages ?? 0} messages</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(channel.id)}
          disabled={submitting}
          className="danger-button h-9 gap-2 px-3"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}
