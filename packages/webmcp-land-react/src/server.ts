// ============ Safety limits ============

const DEFAULT_MAX_MESSAGE_LENGTH = 32_000
const DEFAULT_MAX_MESSAGES = 100
const DEFAULT_MAX_TOOLS = 50
const DEFAULT_MAX_TOKENS = 4096

// ============ Types ============

export interface ProxyMiddleware {
  onBeforeForward?(req: Request, body: Record<string, unknown>): Promise<Record<string, unknown>> | Record<string, unknown>
  onAfterResponse?(req: Request, response: Record<string, unknown>): Promise<void> | void
  onLog?(event: { type: string; timestamp: number; data?: Record<string, unknown> }): void
}

export interface ProxyOptions {
  /**
   * Which LLM provider backend to forward to.
   * - 'openai': forwards to OpenAI API (or baseUrl)
   * - 'anthropic': translates OpenAI-format requests to Anthropic format internally
   * - 'google': translates OpenAI-format requests to Google Gemini format internally
   * - 'custom': forwards to any OpenAI-compatible API at baseUrl
   */
  provider: 'anthropic' | 'openai' | 'google' | 'custom'
  /** Server-side API key -- NEVER sent to the client */
  apiKey: string
  /** Model to use. The server enforces this -- client cannot override. */
  model: string
  /**
   * Base URL for the LLM API. Required for 'custom' provider.
   * Examples:
   * - 'https://api.together.xyz/v1' (Together AI)
   * - 'http://localhost:11434/v1' (Ollama)
   * - 'https://api.groq.com/openai/v1' (Groq)
   * - 'https://openrouter.ai/api/v1' (OpenRouter)
   * Defaults to 'https://api.openai.com/v1' for 'openai' provider.
   */
  baseUrl?: string
  /** Max tokens for the response. Server-enforced. */
  maxTokens?: number

  // --- Safety hooks ---

  authorize?: (request: Request) => Promise<boolean> | boolean
  rateLimiter?: (key: string, request: Request) => Promise<boolean> | boolean
  rateLimitKey?: (request: Request) => string | Promise<string>
  allowedOrigins?: string[]

  // --- Input limits ---

  maxMessageLength?: number
  maxMessages?: number
  maxTools?: number

  systemInstruction?: string

  // --- Middleware ---

  middleware?: ProxyMiddleware
}

// ============ OpenAI-compatible types ============

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: unknown
  }
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  tools?: OpenAITool[]
  max_tokens?: number
}

interface OpenAIResponse {
  id: string
  object: 'chat.completion'
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ============ Helpers ============

function jsonResponse(data: unknown, status: number, corsOrigin?: string): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (corsOrigin) {
    headers['Access-Control-Allow-Origin'] = corsOrigin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  }
  return new Response(JSON.stringify(data), { status, headers })
}

function errorResponse(message: string, status: number, corsOrigin?: string): Response {
  // Return OpenAI-compatible error format
  return jsonResponse(
    { error: { message, type: 'proxy_error', code: status } },
    status,
    corsOrigin
  )
}

// ============ Input validation ============

interface ValidatedBody {
  messages: OpenAIMessage[]
  tools: OpenAITool[]
}

function validateAndSanitizeBody(
  body: unknown,
  limits: {
    maxMessageLength: number
    maxMessages: number
    maxTools: number
  }
): ValidatedBody {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object')
  }

  const obj = body as Record<string, unknown>

  // Extract only allowed fields -- ignore model, max_tokens, etc. from client
  const messages = obj.messages
  if (!Array.isArray(messages)) {
    throw new ValidationError('messages must be an array')
  }
  if (messages.length > limits.maxMessages) {
    throw new ValidationError(`Too many messages (max ${limits.maxMessages})`)
  }
  if (messages.length === 0) {
    throw new ValidationError('messages cannot be empty')
  }

  // Validate individual messages
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      throw new ValidationError('Each message must be an object')
    }
    const m = msg as Record<string, unknown>
    if (typeof m.role !== 'string') {
      throw new ValidationError('Each message must have a role string')
    }
    if (typeof m.content === 'string' && m.content.length > limits.maxMessageLength) {
      throw new ValidationError(`Message content too long (max ${limits.maxMessageLength} characters)`)
    }
  }

  // Tools are optional
  let tools: OpenAITool[] = []
  if (obj.tools !== undefined) {
    if (!Array.isArray(obj.tools)) {
      throw new ValidationError('tools must be an array')
    }
    if (obj.tools.length > limits.maxTools) {
      throw new ValidationError(`Too many tools (max ${limits.maxTools})`)
    }
    tools = obj.tools
  }

  return { messages, tools }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============ Anthropic translation ============

function openaiToAnthropicMessages(
  messages: OpenAIMessage[]
): { system?: string; messages: unknown[] } {
  let system: string | undefined
  const anthropicMessages: unknown[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Anthropic uses a top-level system field
      system = (system ? system + '\n' : '') + (msg.content || '')
      continue
    }

    if (msg.role === 'user') {
      anthropicMessages.push({ role: 'user', content: msg.content || '' })
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant message with tool calls
        const content: unknown[] = []
        if (msg.content) {
          content.push({ type: 'text', text: msg.content })
        }
        for (const tc of msg.tool_calls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          })
        }
        anthropicMessages.push({ role: 'assistant', content })
      } else {
        anthropicMessages.push({ role: 'assistant', content: msg.content || '' })
      }
    } else if (msg.role === 'tool') {
      // Anthropic expects tool results in a user message with tool_result blocks
      const lastMsg = anthropicMessages[anthropicMessages.length - 1] as Record<string, unknown> | undefined
      if (lastMsg?.role === 'user' && Array.isArray(lastMsg.content)) {
        // Append to existing user message with tool results
        (lastMsg.content as unknown[]).push({
          type: 'tool_result',
          tool_use_id: msg.tool_call_id,
          content: msg.content || '',
        })
      } else {
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id,
              content: msg.content || '',
            },
          ],
        })
      }
    }
  }

  return { system, messages: anthropicMessages }
}

function openaiToAnthropicTools(
  tools: OpenAITool[]
): unknown[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }))
}

function anthropicToOpenAIResponse(
  data: Record<string, unknown>,
  model: string
): OpenAIResponse {
  const content = data.content as Array<Record<string, unknown>> | undefined
  if (!content || !Array.isArray(content)) {
    return {
      id: (data.id as string) || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: '' },
          finish_reason: 'stop',
        },
      ],
    }
  }

  const textParts = content
    .filter((c) => c.type === 'text')
    .map((c) => c.text as string)
  const toolUses = content.filter((c) => c.type === 'tool_use')

  const message: OpenAIResponse['choices'][0]['message'] = {
    role: 'assistant',
    content: textParts.join('\n') || null,
  }

  if (toolUses.length > 0) {
    message.tool_calls = toolUses.map((tu) => ({
      id: tu.id as string,
      type: 'function' as const,
      function: {
        name: tu.name as string,
        arguments: JSON.stringify(tu.input),
      },
    }))
  }

  const stopReason = data.stop_reason as string | undefined
  const finishReason =
    stopReason === 'tool_use' ? 'tool_calls' : stopReason === 'end_turn' ? 'stop' : 'stop'

  return {
    id: (data.id as string) || `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage: data.usage
      ? {
          prompt_tokens: (data.usage as Record<string, number>).input_tokens || 0,
          completion_tokens: (data.usage as Record<string, number>).output_tokens || 0,
          total_tokens:
            ((data.usage as Record<string, number>).input_tokens || 0) +
            ((data.usage as Record<string, number>).output_tokens || 0),
        }
      : undefined,
  }
}

// ============ Google Gemini translation ============

interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: unknown }
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

function openaiToGeminiContents(
  messages: OpenAIMessage[]
): { systemInstruction?: string; contents: GeminiContent[] } {
  let systemInstruction: string | undefined
  const contents: GeminiContent[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = (systemInstruction ? systemInstruction + '\n' : '') + (msg.content || '')
      continue
    }

    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content || '' }] })
    } else if (msg.role === 'assistant') {
      const parts: GeminiPart[] = []
      if (msg.content) {
        parts.push({ text: msg.content })
      }
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            },
          })
        }
      }
      if (parts.length > 0) {
        contents.push({ role: 'model', parts })
      }
    } else if (msg.role === 'tool') {
      // Google expects tool results as user-role with functionResponse parts
      const lastContent = contents[contents.length - 1]
      if (lastContent?.role === 'user' && lastContent.parts.some((p) => p.functionResponse)) {
        // Append to existing user message with function responses
        lastContent.parts.push({
          functionResponse: {
            name: msg.tool_call_id || 'unknown',
            response: { result: msg.content || '' },
          },
        })
      } else {
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: msg.tool_call_id || 'unknown',
                response: { result: msg.content || '' },
              },
            },
          ],
        })
      }
    }
  }

  return { systemInstruction, contents }
}

function openaiToGeminiTools(
  tools: OpenAITool[]
): unknown[] {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    },
  ]
}

function geminiToOpenAIResponse(
  data: Record<string, unknown>,
  model: string
): OpenAIResponse {
  const candidates = data.candidates as Array<Record<string, unknown>> | undefined
  if (!candidates || candidates.length === 0) {
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: '' },
          finish_reason: 'stop',
        },
      ],
    }
  }

  const candidate = candidates[0]
  const content = candidate.content as { role: string; parts: GeminiPart[] } | undefined
  const parts = content?.parts || []

  const textParts = parts.filter((p) => p.text).map((p) => p.text!)
  const functionCalls = parts.filter((p) => p.functionCall)

  const message: OpenAIResponse['choices'][0]['message'] = {
    role: 'assistant',
    content: textParts.join('\n') || null,
  }

  if (functionCalls.length > 0) {
    message.tool_calls = functionCalls.map((p, i) => ({
      id: `call_${Date.now()}_${i}`,
      type: 'function' as const,
      function: {
        name: p.functionCall!.name,
        arguments: JSON.stringify(p.functionCall!.args),
      },
    }))
  }

  const finishReason = candidate.finishReason as string | undefined
  const mappedFinish =
    finishReason === 'STOP' ? 'stop' : finishReason === 'TOOL_CODE' ? 'tool_calls' : 'stop'

  const usage = data.usageMetadata as Record<string, number> | undefined

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    model,
    choices: [{ index: 0, message, finish_reason: mappedFinish }],
    usage: usage
      ? {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: usage.totalTokenCount || 0,
        }
      : undefined,
  }
}

// ============ Main export ============

/**
 * Creates an OpenAI-compatible API proxy handler.
 *
 * The proxy always accepts and returns OpenAI Chat Completions format,
 * regardless of the backend provider. This means:
 * - Any OpenAI-compatible client can talk to your proxy
 * - Custom providers (Ollama, Together, Groq, OpenRouter, etc.) just work
 * - Anthropic and Google Gemini requests are translated automatically
 */
export function createWebMCPProxy(options: ProxyOptions) {
  const {
    provider,
    apiKey,
    model,
    baseUrl: customBaseUrl,
    maxTokens = DEFAULT_MAX_TOKENS,
    authorize,
    rateLimiter,
    rateLimitKey,
    allowedOrigins,
    maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH,
    maxMessages = DEFAULT_MAX_MESSAGES,
    maxTools = DEFAULT_MAX_TOOLS,
    systemInstruction,
    middleware,
  } = options

  // Resolve the base URL
  const baseUrl =
    customBaseUrl ||
    (provider === 'openai' ? 'https://api.openai.com/v1' : undefined)

  // Validate config
  if (provider === 'custom' && !baseUrl) {
    throw new Error('baseUrl is required when provider is "custom"')
  }

  return async function handler(request: Request): Promise<Response> {
    // --- CORS preflight ---
    const origin = request.headers.get('Origin') || ''
    const corsOrigin = allowedOrigins
      ? allowedOrigins.includes(origin) ? origin : undefined
      : origin || undefined

    if (request.method === 'OPTIONS') {
      return jsonResponse(null, 204, corsOrigin)
    }

    // --- Origin check ---
    if (allowedOrigins && origin && !allowedOrigins.includes(origin)) {
      return errorResponse('Origin not allowed', 403)
    }

    // --- Method check ---
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405, corsOrigin)
    }

    // --- Authorization ---
    if (authorize) {
      try {
        const allowed = await authorize(request)
        if (!allowed) {
          return errorResponse('Unauthorized', 401, corsOrigin)
        }
      } catch {
        return errorResponse('Authorization failed', 401, corsOrigin)
      }
    }

    // --- Rate limiting ---
    if (rateLimiter) {
      try {
        const key = rateLimitKey ? await rateLimitKey(request) : 'anonymous'
        const allowed = await rateLimiter(key, request)
        if (!allowed) {
          return errorResponse('Rate limit exceeded', 429, corsOrigin)
        }
      } catch {
        return errorResponse('Rate limit check failed', 500, corsOrigin)
      }
    }

    try {
      const rawBody = await request.json()

      // Validate and sanitize -- strips model, max_tokens, and other fields
      const validated = validateAndSanitizeBody(rawBody, {
        maxMessageLength,
        maxMessages,
        maxTools,
      })

      // Inject system instruction
      let messages = validated.messages
      if (systemInstruction) {
        // Replace or prepend system message
        const hasSystem = messages.length > 0 && messages[0].role === 'system'
        if (hasSystem) {
          messages = [{ role: 'system', content: systemInstruction }, ...messages.slice(1)]
        } else {
          messages = [{ role: 'system', content: systemInstruction }, ...messages]
        }
      }

      // ---- Route to backend ----

      middleware?.onLog?.({ type: 'request', timestamp: Date.now(), data: { provider, model } })

      if (provider === 'anthropic') {
        // Translate OpenAI format to Anthropic format
        const { system, messages: anthropicMessages } = openaiToAnthropicMessages(messages)

        let anthropicBody: Record<string, unknown> = {
          model,
          max_tokens: maxTokens,
          messages: anthropicMessages,
        }
        if (system || systemInstruction) {
          anthropicBody.system = systemInstruction || system
        }
        if (validated.tools.length > 0) {
          anthropicBody.tools = openaiToAnthropicTools(validated.tools)
        }

        if (middleware?.onBeforeForward) {
          anthropicBody = await middleware.onBeforeForward(request, anthropicBody)
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(anthropicBody),
        })

        if (!res.ok) {
          return errorResponse('LLM request failed', 502, corsOrigin)
        }

        const data = await res.json()
        await middleware?.onAfterResponse?.(request, data)
        middleware?.onLog?.({ type: 'response', timestamp: Date.now(), data: { provider } })

        // Translate Anthropic response back to OpenAI format
        return jsonResponse(anthropicToOpenAIResponse(data, model), 200, corsOrigin)
      }

      if (provider === 'google') {
        // Translate OpenAI format to Google Gemini format
        const { systemInstruction: extractedSystem, contents } = openaiToGeminiContents(messages)

        let geminiBody: Record<string, unknown> = { contents }

        const finalSystem = systemInstruction || extractedSystem
        if (finalSystem) {
          geminiBody.systemInstruction = { parts: [{ text: finalSystem }] }
        }
        if (validated.tools.length > 0) {
          geminiBody.tools = openaiToGeminiTools(validated.tools)
        }

        if (middleware?.onBeforeForward) {
          geminiBody = await middleware.onBeforeForward(request, geminiBody)
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        })

        if (!res.ok) {
          return errorResponse('LLM request failed', 502, corsOrigin)
        }

        const data = await res.json()
        await middleware?.onAfterResponse?.(request, data)
        middleware?.onLog?.({ type: 'response', timestamp: Date.now(), data: { provider } })

        // Translate Gemini response back to OpenAI format
        return jsonResponse(geminiToOpenAIResponse(data, model), 200, corsOrigin)
      }

      // OpenAI or custom OpenAI-compatible provider
      let openaiBody: Record<string, unknown> = {
        model,
        messages,
        max_tokens: maxTokens,
      }
      if (validated.tools.length > 0) {
        openaiBody.tools = validated.tools
      }

      if (middleware?.onBeforeForward) {
        openaiBody = await middleware.onBeforeForward(request, openaiBody)
      }

      const url = `${baseUrl}/chat/completions`

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(openaiBody),
      })

      if (!res.ok) {
        return errorResponse('LLM request failed', 502, corsOrigin)
      }

      const data = await res.json()
      await middleware?.onAfterResponse?.(request, data)
      middleware?.onLog?.({ type: 'response', timestamp: Date.now(), data: { provider } })
      return jsonResponse(data, 200, corsOrigin)
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(error.message, 400, corsOrigin)
      }
      return errorResponse('Internal server error', 500, corsOrigin)
    }
  }
}
