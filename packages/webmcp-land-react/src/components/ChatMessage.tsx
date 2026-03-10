import React, { useCallback, useRef, useEffect } from 'react'
import type { ChatMessageProps, MessageFeedback } from '../types'
import { renderMarkdown } from '../core/markdown'
import { ThumbsUpIcon, ThumbsDownIcon } from './icons'

function getRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ChatMessage({
  message,
  showTimestamp = false,
  isGrouped = false,
  enableFeedback = false,
  onFeedback,
  enableCodeCopy = true,
}: ChatMessageProps) {
  const { type, content, attachments, isStreaming, timestamp, feedback, id } = message
  const bubbleRef = useRef<HTMLDivElement>(null)

  const messageClass = `wmcp-message wmcp-message-${type}${isGrouped ? ' wmcp-message-grouped' : ''}${!isGrouped ? ' wmcp-msg-with-avatar' : ''}`
  const isAssistant = type === 'assistant'
  const isUser = type === 'user'
  const showAvatar = !isGrouped && (isAssistant || isUser)

  const handleFeedback = useCallback(
    (value: MessageFeedback) => {
      if (!onFeedback) return
      onFeedback(id, feedback === value ? null : value)
    },
    [id, feedback, onFeedback]
  )

  useEffect(() => {
    if (!enableCodeCopy || !bubbleRef.current) return

    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.wmcp-code-copy-btn') as HTMLButtonElement | null
      if (!btn) return
      const code = decodeURIComponent(btn.dataset.code || '')
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add('wmcp-copied')
        btn.setAttribute('aria-label', 'Copied!')
        setTimeout(() => {
          btn.classList.remove('wmcp-copied')
          btn.setAttribute('aria-label', 'Copy code')
        }, 2000)
      }).catch(() => {})
    }

    const el = bubbleRef.current
    el.addEventListener('click', handleClick)
    return () => el.removeEventListener('click', handleClick)
  }, [enableCodeCopy, content])

  return (
    <div className={messageClass} role="listitem" aria-label={`${type} message`}>
      {showAvatar && isAssistant && (
        <div className="wmcp-msg-avatar wmcp-msg-avatar-ai">AI</div>
      )}

      <div className="wmcp-message-bubble" ref={bubbleRef}>
        {attachments && attachments.length > 0 && (
          <div className="wmcp-message-attachments" role="group" aria-label="Attachments">
            {attachments.map((att, i) =>
              att.type === 'image' ? (
                <img
                  key={i}
                  src={att.url}
                  alt={att.name || 'Image attachment'}
                  className="wmcp-message-image"
                />
              ) : (
                <div key={i} className="wmcp-message-file" aria-label={att.name || 'File attachment'}>
                  {att.name || 'File'}
                </div>
              )
            )}
          </div>
        )}

        {isAssistant ? (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content, enableCodeCopy) }} />
        ) : (
          content
        )}

        {isStreaming && <span className="wmcp-streaming-cursor" aria-label="Generating response" />}
      </div>

      {showAvatar && isUser && (
        <div className="wmcp-msg-avatar wmcp-msg-avatar-user">You</div>
      )}

      {showTimestamp && timestamp && (
        <span className="wmcp-message-timestamp" aria-label={`Sent ${getRelativeTime(timestamp)}`}>
          {getRelativeTime(timestamp)}
        </span>
      )}

      {enableFeedback && isAssistant && !isStreaming && content && (
        <div className="wmcp-message-feedback" role="group" aria-label="Message feedback">
          <button
            className={`wmcp-feedback-btn${feedback === 'thumbs-up' ? ' wmcp-active' : ''}`}
            onClick={() => handleFeedback('thumbs-up')}
            aria-label="Thumbs up"
            aria-pressed={feedback === 'thumbs-up'}
            title="Helpful"
          >
            <ThumbsUpIcon filled={feedback === 'thumbs-up'} />
          </button>
          <button
            className={`wmcp-feedback-btn${feedback === 'thumbs-down' ? ' wmcp-active' : ''}`}
            onClick={() => handleFeedback('thumbs-down')}
            aria-label="Thumbs down"
            aria-pressed={feedback === 'thumbs-down'}
            title="Not helpful"
          >
            <ThumbsDownIcon filled={feedback === 'thumbs-down'} />
          </button>
        </div>
      )}
    </div>
  )
}
