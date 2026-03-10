import type { WebMCPPlugin } from './types'
import type { EventBus } from '../engine/EventBus'

export interface AnalyticsEvent {
  type: string
  timestamp: number
  data?: Record<string, unknown>
}

export interface AnalyticsOptions {
  onEvent: (event: AnalyticsEvent) => void
}

export function createAnalyticsPlugin(options: AnalyticsOptions): WebMCPPlugin {
  const { onEvent } = options
  const unsubscribers: Array<() => void> = []

  function emit(type: string, data?: Record<string, unknown>) {
    onEvent({ type, timestamp: Date.now(), data })
  }

  return {
    name: 'analytics',

    install({ events }: { events: EventBus }) {
      unsubscribers.push(
        events.on('messageAdded', ({ message }) => {
          emit('message', { type: message.type, id: message.id })
        }),
        events.on('streamStart', () => emit('stream_start')),
        events.on('streamEnd', () => emit('stream_end')),
        events.on('toolCall', ({ name, args }) => emit('tool_call', { name, args })),
        events.on('toolResult', ({ name }) => emit('tool_result', { name })),
        events.on('error', ({ error }) => emit('error', { message: error.message })),
        events.on('reset', () => emit('reset')),
        events.on('providerChange', ({ provider }) => emit('provider_change', { provider })),
      )
    },

    async onBeforeSend({ text }) {
      emit('send', { textLength: text.length })
    },

    async onAfterReceive({ text }) {
      emit('receive', { textLength: text.length })
    },

    destroy() {
      for (const unsub of unsubscribers) {
        unsub()
      }
      unsubscribers.length = 0
    },
  }
}
