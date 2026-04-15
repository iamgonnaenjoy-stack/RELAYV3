import clsx from 'clsx'
import { Hash, Radio, Trash2 } from 'lucide-react'
import { AdminChannel } from '@/lib/types'

interface ChannelRowProps {
  channel: AdminChannel
  submitting: boolean
  onDelete: (channelId: string) => void
}

export default function ChannelRow({ channel, submitting, onDelete }: ChannelRowProps) {
  return (
    <div className="rounded-panel border border-border bg-bg-elevated px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-control border',
                channel.type === 'VOICE'
                  ? 'border-[#214034] bg-[#0b1712] text-success'
                  : 'border-[#232c51] bg-[#0c1020] text-accent'
              )}
            >
              {channel.type === 'VOICE' ? <Radio size={15} /> : <Hash size={15} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">#{channel.name}</p>
              <p className="text-xs text-text-secondary">{channel.description ?? 'No description'}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            <span className="rounded-full border border-border px-2 py-1">{channel.type}</span>
            <span className="rounded-full border border-border px-2 py-1">position {channel.position}</span>
            <span className="rounded-full border border-border px-2 py-1">
              {channel._count?.messages ?? 0} messages
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(channel.id)}
          disabled={submitting}
          className="danger-button gap-2"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}
