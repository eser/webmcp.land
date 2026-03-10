import { ProviderAdapter } from './ProviderAdapter'
import type { AdapterSendParams, ProviderResponse, ToolResult } from './types'

interface GoogleChatSession {
  sendMessage: (params: { message: unknown; config: unknown }) => Promise<{
    text?: string
    functionCalls?: Array<{ name: string; args: Record<string, unknown> }>
  }>
}

interface GoogleGenAIInstance {
  chats: {
    create: (params: { model: string }) => GoogleChatSession
  }
}

interface GoogleGenAIConstructor {
  new (params: { apiKey: string }): GoogleGenAIInstance
}

let GoogleGenAIClass: GoogleGenAIConstructor | null = null

async function getGoogleGenAI(): Promise<GoogleGenAIConstructor> {
  if (GoogleGenAIClass) return GoogleGenAIClass
  try {
    const mod = await import('@anthropic-ai/google-genai' as string)
    GoogleGenAIClass = mod.GoogleGenAI || mod.default?.GoogleGenAI
    if (!GoogleGenAIClass) throw new Error('GoogleGenAI not found in module')
    return GoogleGenAIClass
  } catch {
    throw new Error(
      'Google GenAI SDK not found. Install @google/genai to use the Google provider.'
    )
  }
}

export class GoogleAdapter extends ProviderAdapter {
  readonly name = 'google'
  readonly displayName = 'Google'
  readonly models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']
  readonly defaultModel = 'gemini-2.5-flash'

  private genAI: GoogleGenAIInstance | null = null
  private chat: GoogleChatSession | null = null
  private currentApiKey: string | null = null
  private currentModel: string | null = null

  buildToolResponses(results: ToolResult[]): Array<{ functionResponse: { name: string; response: unknown } }> {
    return results.map(({ name, result, error }) => ({
      functionResponse: { name, response: error ? { error } : { result } },
    }))
  }

  async send(params: AdapterSendParams): Promise<ProviderResponse> {
    const { message, toolResponses, tools, systemInstruction, model, apiKey } = params

    if (!this.genAI || this.currentApiKey !== apiKey) {
      const GenAI = await getGoogleGenAI()
      this.genAI = new GenAI({ apiKey })
      this.chat = null
      this.currentApiKey = apiKey
      this.currentModel = null
    }

    if (!this.chat || this.currentModel !== model) {
      this.chat = this.genAI!.chats.create({ model })
      this.currentModel = model
    }

    const functionDeclarations = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parametersJsonSchema: t.inputSchema,
    }))

    const config = {
      systemInstruction,
      tools: functionDeclarations.length ? [{ functionDeclarations }] : undefined,
    }

    const response = await this.chat.sendMessage({
      message: toolResponses || message,
      config,
    })

    return {
      text: response.text?.trim(),
      functionCalls: (response.functionCalls || []).map((fc) => ({
        name: fc.name,
        args: fc.args,
      })),
    }
  }

  // Google SDK doesn't support streaming easily, fall back to non-streaming via base class

  resetConversation(): void {
    this.genAI = null
    this.chat = null
    this.currentApiKey = null
    this.currentModel = null
  }

  truncateHistory(_maxMessages: number): void {
    // Google uses a chat session — history managed internally by SDK
  }
}
