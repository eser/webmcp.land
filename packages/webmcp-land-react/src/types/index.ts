// Re-export from subfiles for backward compatibility
export type {
  MessageType,
  MessageAttachment,
  MessageFeedback,
  Message,
} from './messages'

export type {
  JSONSchema,
  ToolDefinition,
  FunctionCall,
  ToolResult,
  ToolDeclaration,
} from './tools'

export type {
  ProviderConfig,
  SendMessageParams,
  ProviderMessage,
  ProviderResponse,
  ProviderDefinition,
  BuiltinProviderName,
  ProviderOption,
  StreamCallback,
  StreamResult,
} from './providers'

export type {
  ThemeColors,
  ThemeFonts,
  ThemeRadii,
  ThemeShadows,
  Theme,
} from './theme'

export type {
  WebMCPEvents,
} from './events'

export type {
  CredentialMode,
  ChatHeaderProps,
  ChatMessageProps,
  ChatInputProps,
  FloatingButtonProps,
  ThinkingIndicatorProps,
  SettingsPanelProps,
  ToolsPanelProps,
  ComponentSlots,
} from './components'

export type {
  WebMCPPlugin,
} from './plugins'

// ============ Main Props ============

import type { WebMCPEvents } from './events'
import type { BuiltinProviderName, ProviderOption } from './providers'
import type { ToolDefinition } from './tools'
import type { Theme } from './theme'
import type { Message, MessageAttachment, MessageFeedback } from './messages'
import type { CredentialMode, ComponentSlots } from './components'
import type { WebMCPPlugin } from './plugins'

export type DisplayMode = 'bottom-right' | 'bottom-left' | 'inline'

export interface WebMCPChatProps extends WebMCPEvents {
  // Provider
  providers?: ProviderOption[]
  systemInstruction?: string
  proxyUrl?: string

  // Tools
  tools?: ToolDefinition[]

  // UI
  displayMode?: DisplayMode
  defaultOpen?: boolean
  showToolsPanel?: boolean
  showSettingsPanel?: boolean
  showFloatingButton?: boolean
  showSettingsButton?: boolean
  showToolsButton?: boolean
  showResetButton?: boolean
  showTraceButton?: boolean
  headerTitle?: string
  headerSubtitle?: string
  placeholder?: string
  welcomeMessage?: string
  logo?: string | React.ReactNode
  floatingIcon?: string | React.ReactNode

  // Theme
  theme?: 'dark' | 'light' | Theme
  accentColor?: string
  borderRadius?: number
  fontFamily?: string

  // Dimensions
  width?: number
  height?: number

  // Advanced
  maxTokens?: number
  temperature?: number
  initialMessages?: Message[]
  persistMessages?: boolean
  storageKey?: string

  // Streaming
  streaming?: boolean

  // Context management
  maxContextMessages?: number

  // Attachments
  enableAttachments?: boolean
  acceptedFileTypes?: string

  // Feedback
  enableFeedback?: boolean
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void

  // Code copy
  enableCodeCopy?: boolean

  // Timestamps
  showTimestamps?: boolean

  // Message grouping
  groupMessages?: boolean

  // Notification badge
  showUnreadBadge?: boolean

  // Keyboard shortcuts
  enableKeyboardShortcuts?: boolean

  // Plugins
  plugins?: WebMCPPlugin[]

  // Suggestions (shown in empty state)
  suggestions?: string[]

  // Component slots
  components?: ComponentSlots
}

// ============ Context ============

export interface WebMCPContextValue {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  provider: string
  model: string
  tools: ToolDefinition[]
  hasApiKey: boolean
  send: (text: string, attachments?: MessageAttachment[]) => Promise<void>
  stop: () => void
  reset: () => void
  addMessage: (type: import('./messages').MessageType, content: string, attachments?: MessageAttachment[]) => Message
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setApiKey: (key: string) => void
}
