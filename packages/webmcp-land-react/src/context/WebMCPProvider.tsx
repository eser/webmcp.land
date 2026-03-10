import React, { createContext, useMemo } from 'react'
import type { WebMCPContextValue, ToolDefinition, ProviderOption, Message, Theme } from '../types'
import type { WebMCPPlugin } from '../plugins/types'
import { useWebMCP } from '../hooks/useWebMCP'
import { useThemeFromOptions } from '../hooks/useTheme'

export const WebMCPContext = createContext<WebMCPContextValue | null>(null)

export interface WebMCPProviderProps {
  children: React.ReactNode
  providers?: ProviderOption[]
  tools?: ToolDefinition[]
  systemInstruction?: string
  maxTokens?: number
  proxyUrl?: string

  streaming?: boolean
  maxContextMessages?: number
  initialMessages?: Message[]
  persistMessages?: boolean
  storageKey?: string
  theme?: 'dark' | 'light' | Theme
  accentColor?: string
  borderRadius?: number
  fontFamily?: string
  plugins?: WebMCPPlugin[]
  onMessage?: (message: Message) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  onToolResult?: (name: string, result: unknown) => void
  onError?: (error: Error) => void
  onProviderChange?: (provider: string) => void
  onStreamToken?: (token: string) => void
}

export function WebMCPProvider({ children, theme: themeOption, accentColor, borderRadius, fontFamily, ...props }: WebMCPProviderProps) {
  const webmcp = useWebMCP(props)
  const { cssVars } = useThemeFromOptions({ theme: themeOption, accentColor, borderRadius, fontFamily })

  const contextValue = useMemo<WebMCPContextValue>(
    () => ({
      messages: webmcp.messages,
      isLoading: webmcp.isLoading,
      isStreaming: webmcp.isStreaming,
      provider: webmcp.provider,
      model: webmcp.model,
      tools: webmcp.tools,
      hasApiKey: webmcp.hasApiKey,
      send: webmcp.send,
      stop: webmcp.stop,
      reset: webmcp.reset,
      addMessage: webmcp.addMessage,
      setProvider: webmcp.setProvider,
      setModel: webmcp.setModel,
      setApiKey: webmcp.setApiKey,
    }),
    [webmcp]
  )

  return (
    <WebMCPContext.Provider value={contextValue}>
      <div style={cssVars as React.CSSProperties}>{children}</div>
    </WebMCPContext.Provider>
  )
}
