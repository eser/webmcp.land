import { useMemo, useCallback, useContext } from 'react'
import type { ToolDefinition, BuiltinProviderName, ProviderOption, MessageAttachment } from '../types'
import type { WebMCPPlugin } from '../plugins/types'
import { useChatEngine } from './useChatEngine'
import { useProvider, type UseProviderOptions } from './useProvider'
import { WebMCPContext } from '../context/WebMCPProvider'
import type { UseMessagesOptions } from './useMessages'

export interface UseWebMCPOptions extends UseProviderOptions, UseMessagesOptions {
  tools?: ToolDefinition[]
  systemInstruction?: string
  maxTokens?: number
  proxyUrl?: string
  streaming?: boolean
  maxContextMessages?: number
  plugins?: WebMCPPlugin[]
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onToolResult?: (name: string, result: unknown) => void
  onError?: (error: Error) => void
  onStreamToken?: (token: string) => void
}

export function useWebMCP(options: UseWebMCPOptions = {}) {
  const {
    tools: toolDefs = [],
    systemInstruction,
    maxTokens = 4096,
    proxyUrl,
    streaming = false,
    maxContextMessages,
    plugins,
    onToolCall,
    onToolResult,
    onError,
    onStreamToken,
    ...rest
  } = options

  const isManaged = !!proxyUrl
  const providerHook = useProvider(rest)

  const engineConfig = useMemo(
    () => ({
      provider: providerHook.providerName,
      model: providerHook.model,
      apiKey: providerHook.apiKey,
      providers: rest.providers,
      tools: toolDefs,
      systemInstruction,
      maxTokens,
      proxyUrl,
      streaming,
      maxContextMessages,
      plugins,
      initialMessages: rest.initialMessages,
      persistMessages: rest.persistMessages,
      storageKey: rest.storageKey,
      onMessage: rest.onMessage,
      onToolCall,
      onToolResult,
      onError,
      onStreamToken,
    }),
    [
      providerHook.providerName,
      providerHook.model,
      providerHook.apiKey,
      rest.providers,
      toolDefs,
      systemInstruction,
      maxTokens,
      proxyUrl,
      streaming,
      maxContextMessages,
      plugins,
      rest.initialMessages,
      rest.persistMessages,
      rest.storageKey,
      rest.onMessage,
      onToolCall,
      onToolResult,
      onError,
      onStreamToken,
    ]
  )

  const { engine, messages, isLoading, isStreaming, send, stop, reset } = useChatEngine(engineConfig)

  const addMessage = useCallback(
    (type: import('../types').MessageType, content: string, attachments?: MessageAttachment[]) => {
      return engine.messageStore.add(type, content, attachments)
    },
    [engine]
  )

  const getTrace = useCallback(() => {
    return [] as unknown[]
  }, [])

  return {
    // State
    messages,
    isLoading,
    isStreaming,

    // Actions
    send,
    stop,
    reset,
    getTrace,
    addMessage,

    // Provider
    provider: providerHook.providerName,
    model: providerHook.model,
    hasApiKey: isManaged || providerHook.hasApiKey,
    isManaged,
    availableProviders: providerHook.availableProviders,
    setProvider: providerHook.setProvider,
    setModel: providerHook.setModel,
    setApiKey: providerHook.setApiKey,

    // Tools
    tools: toolDefs,
  }
}

// Context-based version for use inside WebMCPProvider
export function useWebMCPContext() {
  const context = useContext(WebMCPContext)
  if (!context) {
    throw new Error('useWebMCPContext must be used within a <WebMCPProvider>')
  }
  return context
}
