import { Message } from '@/stores/message.store'
import { format, isToday, isYesterday } from 'date-fns'
import clsx from 'clsx'

interface Props {
  message: Message
  isGrouped: boolean
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

export default function MessageItem({ message, isGrouped }: Props) {
  const color = avatarColor(message.author.username)

  return (
    <div className={clsx(
      'group flex items-start gap-4 px-4 hover:bg-[#0F1115] transition-colors duration-100',
      isGrouped ? 'py-0.5' : 'pt-4 pb-0.5'
    )}>

      {/* Avatar or time */}
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-white text-sm font-semibold hover:underline cursor-pointer" style={{ color }}>
              {message.author.username}
            </span>
            <span className="text-[#4B5563] text-[11px]">{formatTime(message.createdAt)}</span>
            {message.edited && (
              <span className="text-[#4B5563] text-[11px]">(edited)</span>
            )}
          </div>
        )}
        <p className="text-[#A1A6B3] text-sm leading-relaxed break-words">{message.content}</p>
      </div>
    </div>
  )
}
