import type { EventBus } from '../engine/EventBus'
import type { Message, MessageAttachment } from '../types'

export interface WebMCPPlugin {
  name: string
  install?(ctx: { events: EventBus }): void
  onBeforeSend?(ctx: { text: string; attachments?: MessageAttachment[] }): Promise<boolean | void>
  onAfterReceive?(ctx: { text: string }): Promise<void> | void
  onBeforeDisplay?(ctx: { message: Message }): Message | void
  onToolCall?(ctx: { name: string; args: Record<string, unknown> }): Promise<void> | void
  onToolResult?(ctx: { name: string; result: unknown }): Promise<void> | void
  onError?(error: Error): void
  destroy?(): void
}
