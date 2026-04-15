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
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">#{channel.name}</p>
                <span
                  className={clsx(
                    'rounded-control border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    channel.type === 'VOICE'
                      ? 'border-[#184628] bg-[#06110a] text-success'
                      : 'border-[#1d2545] bg-[#0a0f1a] text-accent'
                  )}
                >
                  {channel.type}
                </span>
              </div>
              {channel.description ? (
                <p className="mt-1 truncate text-xs text-text-secondary">{channel.description}</p>
              ) : null}
            </div>
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
