import { useState, useCallback, useRef } from 'react'
import type { Message, MessageType, MessageAttachment } from '../types'

let messageCounter = 0

function createMessage(
  type: MessageType,
  content: string,
  attachments?: MessageAttachment[],
  extra?: Partial<Message>
): Message {
  return {
    id: `msg_${++messageCounter}_${Date.now()}`,
    type,
    content,
    timestamp: Date.now(),
    ...(attachments?.length ? { attachments } : {}),
    ...extra,
  }
}

export interface UseMessagesOptions {
  initialMessages?: Message[]
  persistMessages?: boolean
  storageKey?: string
  onMessage?: (message: Message) => void
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { initialMessages, persistMessages, storageKey = 'webmcp-chat', onMessage } = options

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages
    if (persistMessages && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) return JSON.parse(stored)
      } catch {}
    }
    return []
  })

  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const persist = useCallback(
    (msgs: Message[]) => {
      if (persistMessages && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(msgs))
        } catch {}
      }
    },
    [persistMessages, storageKey]
  )

  const addMessage = useCallback(
    (type: MessageType, content: string, attachments?: MessageAttachment[]): Message => {
      const msg = createMessage(type, content, attachments)
      setMessages((prev) => {
        const next = [...prev, msg]
        persist(next)
        return next
      })
      onMessageRef.current?.(msg)
      return msg
    },
    [persist]
  )

  /** Add a streaming message (isStreaming: true). Returns the message ID for updating. */
  const addStreamingMessage = useCallback((): string => {
    const msg = createMessage('assistant', '', undefined, { isStreaming: true })
    setMessages((prev) => [...prev, msg])
    return msg.id
  }, [])

  /** Update an existing message's content (used for streaming). */
  const updateMessage = useCallback(
    (id: string, content: string, extra?: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, content, ...extra } : msg
        )
      )
    },
    []
  )

  /** Finalize a streaming message (isStreaming: false). */
  const finalizeMessage = useCallback(
    (id: string, content: string) => {
      setMessages((prev) => {
        const next = prev.map((msg) =>
          msg.id === id ? { ...msg, content, isStreaming: false } : msg
        )
        persist(next)
        return next
      })
    },
    [persist]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    if (persistMessages && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {}
    }
  }, [persistMessages, storageKey])

  return {
    messages,
    addMessage,
    addStreamingMessage,
    updateMessage,
    finalizeMessage,
    clearMessages,
    setMessages,
  }
}
