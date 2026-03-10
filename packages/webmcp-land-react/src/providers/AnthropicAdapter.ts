import { ProviderAdapter } from './ProviderAdapter'
import type { AdapterSendParams, AdapterStreamParams, ProviderResponse, StreamResult, ToolResult } from './types'
import type { MessageAttachment } from '../types'

interface AnthropicMessage {
  role: string
  content: unknown
}

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

function buildUserContent(
  text: string,
  attachments?: MessageAttachment[]
): string | AnthropicContentBlock[] {
  if (!attachments || attachments.length === 0) return text
  const blocks: AnthropicContentBlock[] = [{ type: 'text', text }]
  for (const att of attachments) {
    if (att.type === 'image' && att.url.startsWith('data:')) {
      const match = att.url.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: match[1], data: match[2] },
        })
      }
    }
  }
  return blocks
}

export class AnthropicAdapter extends ProviderAdapter {
  readonly name = 'anthropic'
  readonly displayName = 'Anthropic'
  readonly models = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001']
  readonly defaultModel = 'claude-sonnet-4-6'

  private messages: AnthropicMessage[] = []

  buildToolResponses(results: ToolResult[]): Array<{ tool_use_id: string; content: string }> {
    return results.map(({ id, result, error }) => ({
      tool_use_id: id!,
      content: error || (typeof result === 'string' ? result : JSON.stringify(result)),
    }))
  }

  async send(params: AdapterSendParams): Promise<ProviderResponse> {
    const { message, toolResponses, tools, systemInstruction, model, apiKey, maxTokens = 4096, proxyUrl, attachments } = params

    if (message) {
      this.messages.push({ role: 'user', content: buildUserContent(message, attachments) })
    }
    if (toolResponses) {
      this.messages.push({
        role: 'user',
        content: (toolResponses as Array<{ tool_use_id: string; content: string }>).map((tr) => ({
          type: 'tool_result',
          tool_use_id: tr.tool_use_id,
          content: tr.content,
        })),
      })
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      system: systemInstruction,
      messages: this.messages,
    }
    if (tools.length) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }))
    }

    const url = proxyUrl || 'https://api.anthropic.com/v1/messages'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!proxyUrl) {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
      headers['anthropic-dangerous-direct-browser-access'] = 'true'
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await res.json()
    this.messages.push({ role: 'assistant', content: data.content })

    const text = data.content
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('\n')
      .trim()

    const toolCalls = data.content
      .filter((c: { type: string }) => c.type === 'tool_use')
      .map((c: { id: string; name: string; input: Record<string, unknown> }) => ({
        id: c.id,
        name: c.name,
        args: c.input,
      }))

    return { text, functionCalls: toolCalls }
  }

  async sendStreaming(params: AdapterStreamParams): Promise<StreamResult> {
    const { message, toolResponses, tools, systemInstruction, model, apiKey, maxTokens = 4096, proxyUrl, attachments, onChunk, signal } = params

    if (message) {
      this.messages.push({ role: 'user', content: buildUserContent(message, attachments) })
    }
    if (toolResponses) {
      this.messages.push({
        role: 'user',
        content: (toolResponses as Array<{ tool_use_id: string; content: string }>).map((tr) => ({
          type: 'tool_result',
          tool_use_id: tr.tool_use_id,
          content: tr.content,
        })),
      })
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      system: systemInstruction,
      messages: this.messages,
      stream: true,
    }
    if (tools.length) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }))
    }

    const url = proxyUrl || 'https://api.anthropic.com/v1/messages'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!proxyUrl) {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
      headers['anthropic-dangerous-direct-browser-access'] = 'true'
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    let fullText = ''
    const contentBlocks: Array<{ type: string; id?: string; name?: string; input?: string }> = []
    let currentBlockIndex = -1

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)

        try {
          const event = JSON.parse(data)

          if (event.type === 'content_block_start') {
            currentBlockIndex = event.index
            if (event.content_block?.type === 'tool_use') {
              contentBlocks[currentBlockIndex] = {
                type: 'tool_use',
                id: event.content_block.id,
                name: event.content_block.name,
                input: '',
              }
            } else {
              contentBlocks[currentBlockIndex] = { type: 'text' }
            }
          }

          if (event.type === 'content_block_delta') {
            const delta = event.delta
            if (delta?.type === 'text_delta' && delta.text) {
              fullText += delta.text
              onChunk(delta.text)
            }
            if (delta?.type === 'input_json_delta' && delta.partial_json) {
              const block = contentBlocks[currentBlockIndex]
              if (block) {
                block.input = (block.input || '') + delta.partial_json
              }
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    const functionCalls = contentBlocks
      .filter((b) => b.type === 'tool_use' && b.name)
      .map((b) => ({
        id: b.id,
        name: b.name!,
        args: JSON.parse(b.input || '{}'),
      }))

    const historyContent: unknown[] = []
    if (fullText) historyContent.push({ type: 'text', text: fullText })
    for (const fc of functionCalls) {
      historyContent.push({ type: 'tool_use', id: fc.id, name: fc.name, input: fc.args })
    }
    this.messages.push({ role: 'assistant', content: historyContent })

    return { text: fullText.trim(), functionCalls }
  }

  resetConversation(): void {
    this.messages = []
  }

  truncateHistory(maxMessages: number): void {
    if (this.messages.length > maxMessages) {
      this.messages = this.messages.slice(-maxMessages)
    }
  }
}
