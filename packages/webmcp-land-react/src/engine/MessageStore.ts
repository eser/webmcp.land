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

export type MessageStoreListener = () => void

export class MessageStore {
  private messages: Message[] = []
  private listeners = new Set<MessageStoreListener>()
  private persistKey: string | null = null

  constructor(options?: {
    initialMessages?: Message[]
    persistMessages?: boolean
    storageKey?: string
  }) {
    const { initialMessages, persistMessages, storageKey = 'webmcp-chat' } = options || {}

    if (persistMessages) {
      this.persistKey = storageKey
    }

    if (initialMessages && initialMessages.length > 0) {
      this.messages = initialMessages
    } else if (this.persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.persistKey)
        if (stored) this.messages = JSON.parse(stored)
      } catch {}
    }
  }

  getSnapshot = (): Message[] => {
    return this.messages
  }

  subscribe(listener: MessageStoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private persist(): void {
    if (this.persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(this.messages))
      } catch {}
    }
  }

  add(type: MessageType, content: string, attachments?: MessageAttachment[]): Message {
    const msg = createMessage(type, content, attachments)
    this.messages = [...this.messages, msg]
    this.persist()
    this.notify()
    return msg
  }

  addStreaming(): string {
    const msg = createMessage('assistant', '', undefined, { isStreaming: true })
    this.messages = [...this.messages, msg]
    this.notify()
    return msg.id
  }

  update(id: string, content: string, extra?: Partial<Message>): void {
    this.messages = this.messages.map((msg) =>
      msg.id === id ? { ...msg, content, ...extra } : msg
    )
    this.notify()
  }

  finalize(id: string, content: string): void {
    this.messages = this.messages.map((msg) =>
      msg.id === id ? { ...msg, content, isStreaming: false } : msg
    )
    this.persist()
    this.notify()
  }

  clear(): void {
    this.messages = []
    if (this.persistKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.persistKey)
      } catch {}
    }
    this.notify()
  }

  getAll(): Message[] {
    return this.messages
  }
}
