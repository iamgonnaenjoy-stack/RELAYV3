import { useState, useRef, useCallback } from 'react'
import { sendSocketMessage, emitTypingStart, emitTypingStop } from '@/lib/socket'
import { useAuthStore } from '@/stores/auth.store'
import { Plus, Send } from 'lucide-react'

interface Props {
  channelId: string
  channelName: string
}

export default function MessageInput({ channelId, channelName }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const user = useAuthStore((state) => state.user)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTyping = useRef(false)

  const handleTyping = useCallback(() => {
    if (!user) return
    if (!isTyping.current) {
      isTyping.current = true
      emitTypingStart(channelId)
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false
      emitTypingStop(channelId)
    }, 1500)
  }, [channelId, user])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || !user) return

    sendSocketMessage({ channelId, content: trimmed })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    isTyping.current = false
    emitTypingStop(channelId)
    setValue('')
  }

  const canSend = value.trim().length > 0

  return (
    <div style={{ padding: '0 16px 20px', flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          background: '#111111',
          borderRadius: 10,
          border: focused ? '1px solid rgba(88,101,242,0.4)' : '1px solid #222222',
          padding: '10px 14px',
          transition: 'border-color 150ms',
        }}
      >
        <button
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
            transition: 'color 150ms',
          }}
          onMouseEnter={(event) => (event.currentTarget.style.color = '#aaa')}
          onMouseLeave={(event) => (event.currentTarget.style.color = '#555')}
        >
          <Plus size={17} />
        </button>

        <textarea
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
            minHeight: 24,
            maxHeight: 160,
            overflowY: 'auto',
          }}
          placeholder={`Message #${channelName}`}
          value={value}
          rows={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            setValue(event.target.value)
            handleTyping()
            event.target.style.height = 'auto'
            event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: canSend ? '#5865F2' : 'transparent',
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            color: canSend ? '#ffffff' : '#333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
            transition: 'all 150ms',
          }}
          onMouseEnter={(event) => {
            if (canSend) event.currentTarget.style.background = '#4752C4'
          }}
          onMouseLeave={(event) => {
            if (canSend) event.currentTarget.style.background = '#5865F2'
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
