import type { ToolDeclaration, ProviderResponse, StreamCallback, StreamResult, MessageAttachment, ToolResult } from '../types'

export interface AdapterSendParams {
  message: string | null
  toolResponses: unknown[] | null
  tools: ToolDeclaration[]
  systemInstruction: string
  model: string
  apiKey: string
  maxTokens?: number
  proxyUrl?: string
  attachments?: MessageAttachment[]
}

export interface AdapterStreamParams extends AdapterSendParams {
  onChunk: StreamCallback
  signal?: AbortSignal
}

export type { ProviderResponse, StreamResult, ToolResult }
