import type { WebMCPPlugin } from '../plugins/types'
import type { EventBus } from './EventBus'
import type { Message, MessageAttachment } from '../types'

export class PluginManager {
  private plugins: WebMCPPlugin[] = []

  register(plugins: WebMCPPlugin[], events: EventBus): void {
    // Destroy old plugins
    for (const plugin of this.plugins) {
      plugin.destroy?.()
    }
    this.plugins = plugins
    for (const plugin of this.plugins) {
      plugin.install?.({ events })
    }
  }

  async runBeforeSend(ctx: { text: string; attachments?: MessageAttachment[] }): Promise<boolean> {
    for (const plugin of this.plugins) {
      if (plugin.onBeforeSend) {
        const result = await plugin.onBeforeSend(ctx)
        if (result === false) return false
      }
    }
    return true
  }

  async runAfterReceive(ctx: { text: string }): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onAfterReceive) {
        await plugin.onAfterReceive(ctx)
      }
    }
  }

  runBeforeDisplay(ctx: { message: Message }): Message {
    let message = ctx.message
    for (const plugin of this.plugins) {
      if (plugin.onBeforeDisplay) {
        const result = plugin.onBeforeDisplay({ message })
        if (result) message = result
      }
    }
    return message
  }

  async runToolCall(ctx: { name: string; args: Record<string, unknown> }): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onToolCall) {
        await plugin.onToolCall(ctx)
      }
    }
  }

  async runToolResult(ctx: { name: string; result: unknown }): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onToolResult) {
        await plugin.onToolResult(ctx)
      }
    }
  }

  runError(error: Error): void {
    for (const plugin of this.plugins) {
      plugin.onError?.(error)
    }
  }

  destroy(): void {
    for (const plugin of this.plugins) {
      plugin.destroy?.()
    }
    this.plugins = []
  }
}
