import { useCallback, useEffect, useRef, useState } from 'react'
import { emitTypingStart, emitTypingStop } from '@/lib/socket'
import { Plus, Send } from 'lucide-react'
import { useChannelStore } from '@/stores/channel.store'

interface Props {
  channelId: string
  channelName: string
  disabled?: boolean
  onSend: (content: string) => Promise<void>
}

export default function MessageInput({ channelId, channelName, disabled = false, onSend }: Props) {
  const draft = useChannelStore((state) => state.draftsByChannel[channelId] ?? '')
  const setDraft = useChannelStore((state) => state.setDraft)
  const clearDraft = useChannelStore((state) => state.clearDraft)
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTyping = useRef(false)

  const stopTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
      typingTimeout.current = null
    }

    if (isTyping.current) {
      isTyping.current = false
      emitTypingStop(channelId)
    }
  }, [channelId])

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true
      emitTypingStart(channelId)
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      stopTyping()
    }, 1500)
  }, [channelId, stopTyping])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [channelId, draft])

  useEffect(
    () => () => {
      stopTyping()
    },
    [stopTyping]
  )

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  async function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || disabled || submitting) return

    clearDraft(channelId)
    stopTyping()
    setSubmitting(true)

    try {
      await onSend(trimmed)
    } finally {
      setSubmitting(false)
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
  }

  const canSend = draft.trim().length > 0 && !disabled

  return (
    <div className="shrink-0 px-4 pb-5">
      <div
        className={`flex items-end gap-2.5 rounded-card border bg-bg-surface px-3.5 py-2.5 transition-colors duration-150 ${
          focused ? 'border-[rgba(88,101,242,0.4)]' : 'border-border'
        }`}
      >
        <button
          type="button"
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-btn text-text-disabled transition-colors duration-150 hover:text-text-secondary"
          title="Attachments are coming soon"
          disabled={disabled}
        >
          <Plus size={17} />
        </button>

        <textarea
          ref={textareaRef}
          className="min-h-[24px] max-h-[160px] flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-text-primary outline-none placeholder:text-text-disabled"
          placeholder={`Message #${channelName}`}
          value={draft}
          rows={1}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            stopTyping()
          }}
          onChange={(event) => {
            const nextValue = event.target.value
            setDraft(channelId, nextValue)

            if (nextValue.trim()) {
              handleTyping()
            } else {
              stopTyping()
            }
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend || submitting}
          className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-btn transition-colors duration-150 ${
            canSend && !submitting
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'cursor-not-allowed bg-transparent text-[#333333]'
          }`}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
