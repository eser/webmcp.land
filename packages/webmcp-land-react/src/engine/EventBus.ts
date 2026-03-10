import type { Message } from '../types'

export interface EventMap {
  stateChange: { key: string; value: unknown }
  messageAdded: { message: Message }
  messageUpdated: { id: string; content: string }
  streamToken: { token: string }
  streamStart: undefined
  streamEnd: undefined
  toolCall: { name: string; args: Record<string, unknown> }
  toolResult: { name: string; result: unknown }
  providerChange: { provider: string }
  error: { error: Error }
  reset: undefined
}

type EventHandler<T> = (payload: T) => void

export class EventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>()

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(payload)
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear()
  }
}
