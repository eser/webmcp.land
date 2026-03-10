import { EventBus } from './EventBus'
import { MessageStore } from './MessageStore'
import { PluginManager } from './PluginManager'
import { ProviderRegistry } from './ProviderRegistry'
import { ToolExecutor } from './ToolExecutor'
import { createAdapter } from '../providers'
import type { ProviderAdapter } from '../providers/ProviderAdapter'
import type { ChatEngineConfig, EngineState } from './types'
import type { ProviderResponse, StreamResult, MessageAttachment, ToolDefinition, ProviderOption } from '../types'
import { resolveProviders } from '../providers'

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getDefaultSystemInstruction(custom?: string): string {
  const parts = ['You are a helpful assistant.', `Today's date is: ${getFormattedDate()}`]
  if (custom) parts.unshift(custom)
  return parts.join('\n')
}

export class ChatEngine {
  readonly events: EventBus
  readonly messageStore: MessageStore
  readonly pluginManager: PluginManager
  readonly providerRegistry: ProviderRegistry
  readonly toolExecutor: ToolExecutor

  private state: EngineState = { isLoading: false, isStreaming: false }
  private stateListeners = new Set<() => void>()
  private abortController: AbortController | null = null

  private config: ChatEngineConfig
  private systemInstruction: string
  private useProxy: boolean
  private isManaged: boolean

  constructor(config: ChatEngineConfig) {
    this.config = config
    this.events = new EventBus()
    this.messageStore = new MessageStore({
      initialMessages: config.initialMessages,
      persistMessages: config.persistMessages,
      storageKey: config.storageKey,
    })
    this.pluginManager = new PluginManager()
    this.providerRegistry = new ProviderRegistry()
    this.toolExecutor = new ToolExecutor()

    this.systemInstruction = getDefaultSystemInstruction(config.systemInstruction)
    this.useProxy = !!config.proxyUrl
    this.isManaged = !!config.proxyUrl

    // Register adapters from resolved providers
    this.setupAdapters(config.providers || ['google', 'openai', 'anthropic'])

    // Set active provider
    if (config.provider) {
      try {
        this.providerRegistry.setActive(config.provider)
      } catch {
        // Provider not found, keep default
      }
    }

    // Register tools
    if (config.tools) {
      this.toolExecutor.register(config.tools)
    }

    // Register plugins
    if (config.plugins) {
      this.pluginManager.register(config.plugins, this.events)
    }
  }

  private setupAdapters(providers: ProviderOption[]): void {
    const resolved = resolveProviders(providers)
    for (const def of resolved) {
      try {
        const adapter = createAdapter(def.name)
        this.providerRegistry.register(adapter)
      } catch {
        // Skip unknown providers — they're custom ProviderDefinitions, not adapters
      }
    }

    // If proxy mode is active, ensure openai adapter is registered (proxy uses OpenAI format)
    if (this.useProxy && !this.providerRegistry.get('openai')) {
      this.providerRegistry.register(createAdapter('openai'))
    }
  }

  private getAdapter(): ProviderAdapter {
    if (this.useProxy) {
      return this.providerRegistry.get('openai')!
    }
    const adapter = this.providerRegistry.getActive()
    if (!adapter) {
      throw new Error('No active provider')
    }
    return adapter
  }

  private setState(partial: Partial<EngineState>): void {
    this.state = { ...this.state, ...partial }
    for (const listener of this.stateListeners) {
      listener()
    }
    for (const [key, value] of Object.entries(partial)) {
      this.events.emit('stateChange', { key, value })
    }
  }

  getState = (): EngineState => {
    return this.state
  }

  subscribeState(listener: () => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  private applyContextLimit(): void {
    const max = this.config.maxContextMessages
    if (!max) return
    const adapter = this.getAdapter()
    adapter.truncateHistory(max)
  }

  async send(text: string, attachments?: MessageAttachment[]): Promise<void> {
    if (!text.trim()) return
    if (!this.isManaged && !this.config.apiKey) return

    // Run plugin before-send
    const allowed = await this.pluginManager.runBeforeSend({ text, attachments })
    if (!allowed) return

    const msg = this.messageStore.add('user', text, attachments)
    this.events.emit('messageAdded', { message: msg })
    this.config.onMessage?.(msg)
    this.setState({ isLoading: true })

    const controller = new AbortController()
    this.abortController = controller

    try {
      let response: ProviderResponse | StreamResult
      this.applyContextLimit()

      const adapter = this.getAdapter()
      const providerName = this.useProxy ? 'openai' : this.providerRegistry.getActiveName() || 'openai'
      const declarations = this.toolExecutor.getDeclarations()
      const model = this.config.model || adapter.defaultModel
      const apiKey = this.config.apiKey || ''
      const maxTokens = this.config.maxTokens || 4096

      const baseParams = {
        tools: declarations,
        systemInstruction: this.systemInstruction,
        model,
        apiKey,
        maxTokens,
        proxyUrl: this.config.proxyUrl,
      }

      if (this.config.streaming) {
        this.setState({ isStreaming: true })
        this.events.emit('streamStart', undefined)
        const msgId = this.messageStore.addStreaming()

        let accumulatedText = ''
        const wrappedOnChunk = (chunk: string) => {
          accumulatedText += chunk
          this.messageStore.update(msgId, accumulatedText)
          this.events.emit('streamToken', { token: chunk })
          this.config.onStreamToken?.(chunk)
        }

        response = await adapter.sendStreaming({
          ...baseParams,
          message: text,
          toolResponses: null,
          attachments,
          onChunk: wrappedOnChunk,
          signal: controller.signal,
        })

        this.setState({ isStreaming: false })
        this.events.emit('streamEnd', undefined)

        if (response.functionCalls && response.functionCalls.length > 0) {
          if (accumulatedText) {
            this.messageStore.finalize(msgId, accumulatedText)
          } else {
            this.messageStore.finalize(msgId, '')
          }
          await this.handleToolLoop(response, adapter, baseParams, controller.signal)
        } else {
          this.messageStore.finalize(msgId, accumulatedText)
          if (accumulatedText) {
            await this.pluginManager.runAfterReceive({ text: accumulatedText })
          }
        }
      } else {
        response = await adapter.send({
          ...baseParams,
          message: text,
          toolResponses: null,
          attachments,
        })

        await this.handleToolLoop(response, adapter, baseParams, controller.signal)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        this.messageStore.add('system', 'Response stopped.')
      } else {
        const error = err instanceof Error ? err : new Error(String(err))
        this.messageStore.add('error', `Error: ${error.message}`)
        this.events.emit('error', { error })
        this.config.onError?.(error)
        this.pluginManager.runError(error)
      }
    } finally {
      this.setState({ isLoading: false, isStreaming: false })
      this.abortController = null
    }
  }

  private async handleToolLoop(
    initialResponse: ProviderResponse | StreamResult,
    adapter: ProviderAdapter,
    baseParams: {
      tools: ReturnType<ToolExecutor['getDeclarations']>
      systemInstruction: string
      model: string
      apiKey: string
      maxTokens: number
      proxyUrl?: string
    },
    signal?: AbortSignal
  ): Promise<void> {
    let response = initialResponse
    let finalResponseGiven = false
    const tools = this.toolExecutor.getAll()

    while (!finalResponseGiven) {
      const { text: responseText, functionCalls } = response

      if (!functionCalls || functionCalls.length === 0) {
        if (!this.config.streaming || !responseText) {
          if (responseText) {
            const msg = this.messageStore.add('assistant', responseText)
            this.events.emit('messageAdded', { message: msg })
            this.config.onMessage?.(msg)
            await this.pluginManager.runAfterReceive({ text: responseText })
          } else if (!this.config.streaming) {
            this.messageStore.add('error', 'AI response has no text.')
          }
        } else if (responseText) {
          await this.pluginManager.runAfterReceive({ text: responseText })
        }
        finalResponseGiven = true
      } else {
        const toolResultsArr: Array<{
          id?: string
          name: string
          result?: unknown
          error?: string
        }> = []

        for (const fc of functionCalls) {
          const inputArgs = JSON.stringify(fc.args)
          this.messageStore.add('tool-call', `Calling "${fc.name}" with ${inputArgs}`)
          this.events.emit('toolCall', { name: fc.name, args: fc.args })
          this.config.onToolCall?.(fc.name, fc.args)
          await this.pluginManager.runToolCall({ name: fc.name, args: fc.args })

          try {
            const result = await this.toolExecutor.execute(fc.name, fc.args)
            const resultStr = typeof result === 'string' ? result : JSON.stringify(result)
            toolResultsArr.push({ id: fc.id, name: fc.name, result: resultStr })
            this.messageStore.add('tool-result', `${fc.name}: ${resultStr}`)
            this.events.emit('toolResult', { name: fc.name, result })
            this.config.onToolResult?.(fc.name, result)
            await this.pluginManager.runToolResult({ name: fc.name, result })
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e)
            this.messageStore.add('error', `Error executing "${fc.name}": ${errMsg}`)
            toolResultsArr.push({ id: fc.id, name: fc.name, error: errMsg })
          }
        }

        const toolResponses = adapter.buildToolResponses(toolResultsArr)

        if (this.config.streaming) {
          this.setState({ isStreaming: true })
          this.events.emit('streamStart', undefined)
          const msgId = this.messageStore.addStreaming()
          let accumulatedText = ''
          const wrappedOnChunk = (chunk: string) => {
            accumulatedText += chunk
            this.messageStore.update(msgId, accumulatedText)
            this.events.emit('streamToken', { token: chunk })
            this.config.onStreamToken?.(chunk)
          }

          response = await adapter.sendStreaming({
            ...baseParams,
            message: null,
            toolResponses,
            onChunk: wrappedOnChunk,
            signal,
          })

          this.setState({ isStreaming: false })
          this.events.emit('streamEnd', undefined)

          this.messageStore.finalize(msgId, accumulatedText)

          if (!response.functionCalls || response.functionCalls.length === 0) {
            finalResponseGiven = true
            if (accumulatedText) {
              await this.pluginManager.runAfterReceive({ text: accumulatedText })
            }
          }
        } else {
          response = await adapter.send({
            ...baseParams,
            message: null,
            toolResponses,
          })
        }
      }
    }
  }

  stop(): void {
    this.abortController?.abort()
    this.abortController = null
    this.setState({ isLoading: false, isStreaming: false })
  }

  reset(): void {
    this.stop()
    this.messageStore.clear()

    // Reset all adapters
    for (const adapter of this.providerRegistry.getAll()) {
      adapter.resetConversation()
    }

    this.events.emit('reset', undefined)
    this.messageStore.add('system', 'Chat reset.')
  }

  updateConfig(partial: Partial<ChatEngineConfig>): void {
    this.config = { ...this.config, ...partial }

    if (partial.systemInstruction !== undefined) {
      this.systemInstruction = getDefaultSystemInstruction(partial.systemInstruction)
    }
    if (partial.proxyUrl !== undefined) {
      this.useProxy = !!partial.proxyUrl
      this.isManaged = !!partial.proxyUrl
    }
    if (partial.tools) {
      this.toolExecutor.register(partial.tools)
    }
    if (partial.plugins) {
      this.pluginManager.register(partial.plugins, this.events)
    }
    if (partial.provider) {
      try {
        this.providerRegistry.setActive(partial.provider)
        this.events.emit('providerChange', { provider: partial.provider })
      } catch {}
    }
  }

  getIsManaged(): boolean {
    return this.isManaged
  }

  destroy(): void {
    this.stop()
    this.pluginManager.destroy()
    this.events.removeAllListeners()
    this.stateListeners.clear()
  }
}
