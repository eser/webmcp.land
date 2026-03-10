// ============ Components ============
export { WebMCPChat } from './components/WebMCPChat'
export { ChatHeader } from './components/ChatHeader'
export { ChatMessages } from './components/ChatMessages'
export { ChatMessage } from './components/ChatMessage'
export { ChatInput } from './components/ChatInput'
export { SettingsPanel } from './components/SettingsPanel'
export { ToolsPanel } from './components/ToolsPanel'
export { FloatingButton } from './components/FloatingButton'
export { ThinkingIndicator } from './components/ThinkingIndicator'
export { Markdown } from './components/Markdown'

// ============ Context ============
export { WebMCPProvider, WebMCPContext } from './context/WebMCPProvider'

// ============ Hooks ============
export { useWebMCP, useWebMCPContext } from './hooks/useWebMCP'
export { useChatEngine } from './hooks/useChatEngine'
export { useMessages } from './hooks/useMessages'
export { useProvider } from './hooks/useProvider'
export { useTools } from './hooks/useTools'
export { useTheme, useThemeFromOptions } from './hooks/useTheme'

// ============ Engine (advanced/headless) ============
export { ChatEngine } from './engine/ChatEngine'
export { EventBus } from './engine/EventBus'
export { MessageStore } from './engine/MessageStore'
export { PluginManager } from './engine/PluginManager'
export { ProviderRegistry } from './engine/ProviderRegistry'
export { ToolExecutor } from './engine/ToolExecutor'

// ============ Provider Adapters ============
export { ProviderAdapter, OpenAIAdapter, AnthropicAdapter, GoogleAdapter } from './providers'

// ============ Plugins ============
export { createRateLimiterPlugin } from './plugins/rateLimiter'
export { createAnalyticsPlugin } from './plugins/analytics'
export { createModerationPlugin } from './plugins/moderation'

// ============ Core Utilities ============
export { defineTool, getToolDeclarations, executeTool } from './core/tools'
export { renderMarkdown } from './core/markdown'
export { generateTemplateFromSchema } from './core/schema'

// ============ Providers ============
export { resolveProvider, resolveProviders, getBuiltinProvider } from './providers'

// ============ Theme ============
export { darkTheme } from './theme/default'
export { lightTheme } from './theme/light'
export { createTheme, resolveTheme, themeToCSSVars } from './theme/utils'

// ============ defineProvider ============
export function defineProvider(
  provider: import('./types').ProviderDefinition
): import('./types').ProviderDefinition {
  return provider
}

// ============ Types ============
export type {
  // Messages
  Message,
  MessageType,
  MessageAttachment,
  MessageFeedback,

  // Tools
  ToolDefinition,
  ToolDeclaration,
  FunctionCall,
  ToolResult,
  JSONSchema,

  // Providers
  ProviderConfig,
  ProviderDefinition,
  ProviderResponse,
  SendMessageParams,
  ProviderMessage,
  BuiltinProviderName,
  ProviderOption,

  // Streaming
  StreamCallback,
  StreamResult,

  // Theme
  Theme,
  ThemeColors,
  ThemeFonts,
  ThemeRadii,
  ThemeShadows,

  // Component Props
  WebMCPChatProps,
  ChatHeaderProps,
  ChatMessageProps,
  ChatInputProps,
  FloatingButtonProps,
  ThinkingIndicatorProps,
  SettingsPanelProps,
  ToolsPanelProps,
  ComponentSlots,
  WebMCPEvents,
  DisplayMode,
  CredentialMode,
  WebMCPContextValue,

  // Plugins
  WebMCPPlugin,
} from './types'

export type { EventMap } from './engine/EventBus'
export type { ChatEngineConfig, EngineState } from './engine/types'
