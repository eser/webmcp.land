import { ProviderAdapter } from './ProviderAdapter'
import type { AdapterSendParams, AdapterStreamParams, ProviderResponse, StreamResult, ToolResult } from './types'
import type { MessageAttachment } from '../types'

interface OpenAIMessage {
  role: string
  content?: string | OpenAIContentPart[] | null
  tool_calls?: Array<{
    id: string
    type: string
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: string } }

function buildUserContent(
  text: string,
  attachments?: MessageAttachment[]
): string | OpenAIContentPart[] {
  if (!attachments || attachments.length === 0) return text
  const parts: OpenAIContentPart[] = [{ type: 'text', text }]
  for (const att of attachments) {
    if (att.type === 'image') {
      parts.push({ type: 'image_url', image_url: { url: att.url } })
    }
  }
  return parts
}

export class OpenAIAdapter extends ProviderAdapter {
  readonly name = 'openai'
  readonly displayName = 'OpenAI'
  readonly models = ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o3-mini']
  readonly defaultModel = 'gpt-4.1'

  private messages: OpenAIMessage[] = []

  buildToolResponses(results: ToolResult[]): Array<{ tool_call_id: string; content: string }> {
    return results.map(({ id, result, error }) => ({
      tool_call_id: id!,
      content: error || (typeof result === 'string' ? result : JSON.stringify(result)),
    }))
  }

  async send(params: AdapterSendParams): Promise<ProviderResponse> {
    const { message, toolResponses, tools, systemInstruction, model, apiKey, proxyUrl, attachments } = params

    if (message) {
      this.messages.push({ role: 'user', content: buildUserContent(message, attachments) })
    }
    if (toolResponses) {
      for (const tr of toolResponses as Array<{ tool_call_id: string; content: string }>) {
        this.messages.push({ role: 'tool', tool_call_id: tr.tool_call_id, content: tr.content })
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'system', content: systemInstruction }, ...this.messages],
    }
    if (tools.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }))
    }

    const url = proxyUrl || 'https://api.openai.com/v1/chat/completions'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!proxyUrl) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const data = await res.json()
    const choice = data.choices[0]
    this.messages.push(choice.message)

    const toolCalls = (choice.message.tool_calls || []).map(
      (tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      })
    )

    return { text: choice.message.content?.trim(), functionCalls: toolCalls }
  }

  async sendStreaming(params: AdapterStreamParams): Promise<StreamResult> {
    const { message, toolResponses, tools, systemInstruction, model, apiKey, proxyUrl, attachments, onChunk, signal } = params

    if (message) {
      this.messages.push({ role: 'user', content: buildUserContent(message, attachments) })
    }
    if (toolResponses) {
      for (const tr of toolResponses as Array<{ tool_call_id: string; content: string }>) {
        this.messages.push({ role: 'tool', tool_call_id: tr.tool_call_id, content: tr.content })
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'system', content: systemInstruction }, ...this.messages],
      stream: true,
    }
    if (tools.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }))
    }

    const url = proxyUrl || 'https://api.openai.com/v1/chat/completions'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!proxyUrl) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    let fullText = ''
    const toolCallDeltas: Record<number, { id: string; name: string; arguments: string }> = {}

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
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta

          if (delta?.content) {
            fullText += delta.content
            onChunk(delta.content)
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0
              if (!toolCallDeltas[idx]) {
                toolCallDeltas[idx] = { id: tc.id || '', name: '', arguments: '' }
              }
              if (tc.id) toolCallDeltas[idx].id = tc.id
              if (tc.function?.name) toolCallDeltas[idx].name += tc.function.name
              if (tc.function?.arguments) toolCallDeltas[idx].arguments += tc.function.arguments
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    const assistantMsg: OpenAIMessage = { role: 'assistant', content: fullText || null }
    const functionCalls = Object.values(toolCallDeltas).map((tc) => ({
      id: tc.id,
      name: tc.name,
      args: JSON.parse(tc.arguments || '{}'),
    }))

    if (functionCalls.length > 0) {
      assistantMsg.tool_calls = Object.values(toolCallDeltas).map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      }))
    }
    this.messages.push(assistantMsg)

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
