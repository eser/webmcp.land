import React, { useRef, useEffect, type ComponentType } from 'react'
import type { Message, ChatMessageProps, ThinkingIndicatorProps, MessageFeedback } from '../types'
import { ChatMessage as DefaultChatMessage } from './ChatMessage'
import { ThinkingIndicator as DefaultThinkingIndicator } from './ThinkingIndicator'
import { SparkleIcon } from './icons'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  MessageComponent?: ComponentType<ChatMessageProps> | null
  ThinkingComponent?: ComponentType<ThinkingIndicatorProps> | null
  showTimestamps?: boolean
  groupMessages?: boolean
  enableFeedback?: boolean
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void
  enableCodeCopy?: boolean
  welcomeMessage?: string
  suggestions?: string[]
  onSuggestionClick?: (text: string) => void
}

export function ChatMessages({
  messages,
  isLoading,
  MessageComponent,
  ThinkingComponent,
  showTimestamps = false,
  groupMessages = true,
  enableFeedback = false,
  onFeedback,
  enableCodeCopy = true,
  welcomeMessage,
  suggestions,
  onSuggestionClick,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const MessageComp = MessageComponent === null ? null : (MessageComponent || DefaultChatMessage)
  const ThinkingComp = ThinkingComponent === null ? null : (ThinkingComponent || DefaultThinkingIndicator)

  const isEmpty = messages.length === 0 && !isLoading

  if (isEmpty) {
    return (
      <div className="wmcp-empty-state" role="status" aria-label="No messages yet">
        <div className="wmcp-empty-icon">
          <SparkleIcon size={24} />
        </div>
        <div className="wmcp-empty-text">
          {welcomeMessage || 'How can I help you today?'}
        </div>
        {suggestions && suggestions.length > 0 && (
          <div className="wmcp-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="wmcp-suggestion-chip"
                onClick={() => onSuggestionClick?.(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="wmcp-chat-messages"
      role="list"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : null
        const isGrouped = groupMessages && prevMsg !== null && prevMsg.type === msg.type

        return MessageComp ? (
          <MessageComp
            key={msg.id}
            message={msg}
            showTimestamp={showTimestamps}
            isGrouped={isGrouped}
            enableFeedback={enableFeedback}
            onFeedback={onFeedback}
            enableCodeCopy={enableCodeCopy}
          />
        ) : null
      })}
      {isLoading && ThinkingComp && <ThinkingComp />}
    </div>
  )
}
