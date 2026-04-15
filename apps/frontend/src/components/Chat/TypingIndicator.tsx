interface Props {
  users: string[]
}

function formatTypingCopy(users: string[]) {
  if (users.length === 0) {
    return ''
  }

  if (users.length === 1) {
    return `${users[0]} is typing...`
  }

  if (users.length === 2) {
    return `${users[0]} and ${users[1]} are typing...`
  }

  return `${users[0]}, ${users[1]}, and others are typing...`
}

export default function TypingIndicator({ users }: Props) {
  if (users.length === 0) {
    return <div className="h-6 shrink-0" aria-hidden="true" />
  }

  return (
    <div className="flex h-6 shrink-0 items-center px-4 text-xs text-text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted" />
        </span>
        {formatTypingCopy(users)}
      </span>
    </div>
  )
}
