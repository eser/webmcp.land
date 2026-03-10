import type { AdapterSendParams, AdapterStreamParams, ProviderResponse, StreamResult, ToolResult } from './types'

export abstract class ProviderAdapter {
  abstract readonly name: string
  abstract readonly displayName: string
  abstract readonly models: string[]
  abstract readonly defaultModel: string

  abstract send(params: AdapterSendParams): Promise<ProviderResponse>

  async sendStreaming(params: AdapterStreamParams): Promise<StreamResult> {
    // Default: fall back to non-streaming
    const result = await this.send(params)
    if (result.text) {
      params.onChunk(result.text)
    }
    return { text: result.text || '', functionCalls: result.functionCalls }
  }

  abstract buildToolResponses(results: ToolResult[]): unknown[]

  abstract resetConversation(): void

  abstract truncateHistory(maxMessages: number): void
}
