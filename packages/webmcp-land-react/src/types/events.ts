import type { Message, MessageFeedback } from './messages'

export interface WebMCPEvents {
  onMessage?: (message: Message) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onToolResult?: (name: string, result: unknown) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
  onProviderChange?: (provider: string) => void
  onStreamToken?: (token: string) => void
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void
}
