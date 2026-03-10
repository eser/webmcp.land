import { useRef, useCallback, useEffect, useSyncExternalStore } from 'react'
import { ChatEngine } from '../engine/ChatEngine'
import type { ChatEngineConfig } from '../engine/types'
import type { MessageAttachment } from '../types'

export function useChatEngine(config: ChatEngineConfig) {
  const engineRef = useRef<ChatEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new ChatEngine(config)
  }

  const engine = engineRef.current

  // Update config on changes (apiKey, model, provider, tools, plugins, etc.)
  useEffect(() => {
    engine.updateConfig(config)
  }, [
    config.apiKey,
    config.model,
    config.provider,
    config.tools,
    config.systemInstruction,
    config.maxTokens,
    config.proxyUrl,
    config.streaming,
    config.maxContextMessages,
    config.plugins,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.destroy()
    }
  }, [])

  // Subscribe to messages via useSyncExternalStore
  const messages = useSyncExternalStore(
    useCallback((cb) => engine.messageStore.subscribe(cb), [engine]),
    engine.messageStore.getSnapshot,
    engine.messageStore.getSnapshot
  )

  // Subscribe to engine state
  const engineState = useSyncExternalStore(
    useCallback((cb) => engine.subscribeState(cb), [engine]),
    engine.getState,
    engine.getState
  )

  const send = useCallback(
    (text: string, attachments?: MessageAttachment[]) => engine.send(text, attachments),
    [engine]
  )

  const stop = useCallback(() => engine.stop(), [engine])

  const reset = useCallback(() => engine.reset(), [engine])

  return {
    engine,
    messages,
    isLoading: engineState.isLoading,
    isStreaming: engineState.isStreaming,
    send,
    stop,
    reset,
  }
}
