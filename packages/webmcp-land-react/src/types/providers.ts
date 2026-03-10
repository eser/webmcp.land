import type { ToolDeclaration } from './tools'
import type { FunctionCall } from './tools'

export interface ProviderConfig {
  name: string
  models: string[]
  defaultModel: string
}

export interface SendMessageParams {
  messages: ProviderMessage[]
  tools: ToolDeclaration[]
  systemInstruction: string
  model: string
  apiKey: string
}

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'tool'
  content: unknown
}

export interface ProviderResponse {
  text?: string
  functionCalls: FunctionCall[]
}

export interface ProviderDefinition {
  name: string
  displayName: string
  models: string[]
  defaultModel: string
  sendMessage: (params: SendMessageParams) => Promise<ProviderResponse>
}

export type BuiltinProviderName = 'google' | 'openai' | 'anthropic'

export type ProviderOption = BuiltinProviderName | ProviderDefinition

export type StreamCallback = (chunk: string) => void

export interface StreamResult {
  text: string
  functionCalls: FunctionCall[]
}
