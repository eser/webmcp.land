import type { ToolDefinition, MessageAttachment, Message, ProviderOption } from '../types'
import type { WebMCPPlugin } from '../plugins/types'

export interface ChatEngineConfig {
  provider?: string
  model?: string
  /** @internal Set by the BYOK settings panel — never passed as a public prop */
  apiKey?: string
  providers?: ProviderOption[]
  tools?: ToolDefinition[]
  systemInstruction?: string
  maxTokens?: number
  proxyUrl?: string
  streaming?: boolean
  maxContextMessages?: number
  initialMessages?: Message[]
  persistMessages?: boolean
  storageKey?: string
  plugins?: WebMCPPlugin[]
  onMessage?: (message: Message) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onToolResult?: (name: string, result: unknown) => void
  onError?: (error: Error) => void
  onStreamToken?: (token: string) => void
}

export interface EngineState {
  isLoading: boolean
  isStreaming: boolean
}
