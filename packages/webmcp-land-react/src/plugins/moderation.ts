import type { WebMCPPlugin } from './types'
import type { Message } from '../types'

export interface ModerationOptions {
  checkContent: (text: string) => Promise<boolean> | boolean
}

export function createModerationPlugin(options: ModerationOptions): WebMCPPlugin {
  const { checkContent } = options

  return {
    name: 'moderation',

    async onBeforeSend({ text }) {
      const allowed = await checkContent(text)
      if (!allowed) return false
    },

    onBeforeDisplay({ message }: { message: Message }) {
      // Could filter or modify displayed messages
      return message
    },
  }
}
