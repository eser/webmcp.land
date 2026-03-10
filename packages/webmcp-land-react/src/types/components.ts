import type { ComponentType } from 'react'
import type { Message, MessageAttachment, MessageFeedback } from './messages'
import type { ToolDefinition } from './tools'
import type { ProviderOption, BuiltinProviderName } from './providers'
import type { Theme } from './theme'

export type CredentialMode = 'byok' | 'managed'

export interface ChatHeaderProps {
  title: string
  subtitle: string
  isLoading: boolean
  onSettingsClick: () => void
  onToolsClick: () => void
  settingsOpen: boolean
  toolsOpen: boolean
  logo?: string | React.ReactNode
  showSettingsButton?: boolean
  showToolsButton?: boolean
}

export interface ChatMessageProps {
  message: Message
  showTimestamp?: boolean
  isGrouped?: boolean
  enableFeedback?: boolean
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void
  enableCodeCopy?: boolean
}

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled: boolean
  isLoading: boolean
  onReset: () => void
  onTrace: () => void
  showResetButton?: boolean
  showTraceButton?: boolean
  attachments?: MessageAttachment[]
  onAttach?: (attachment: MessageAttachment) => void
  onRemoveAttachment?: (index: number) => void
  enableAttachments?: boolean
  onStop?: () => void
  isStreaming?: boolean
}

export interface FloatingButtonProps {
  onClick: () => void
  isOpen: boolean
  isLoading: boolean
  icon?: string | React.ReactNode
  unreadCount?: number
}

export interface ThinkingIndicatorProps {}

export interface SettingsPanelProps {
  provider: string
  model: string
  providers: ProviderOption[]
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
  onApiKeySave: (key: string) => void
  hasApiKey: boolean
  availableModels: string[]
  credentialMode?: CredentialMode
}

export interface ToolsPanelProps {
  tools: ToolDefinition[]
  onExecute: (name: string, args: Record<string, unknown>) => Promise<unknown>
}

export interface ComponentSlots {
  Header?: ComponentType<ChatHeaderProps> | null
  Message?: ComponentType<ChatMessageProps> | null
  Input?: ComponentType<ChatInputProps> | null
  FloatingButton?: ComponentType<FloatingButtonProps> | null
  ThinkingIndicator?: ComponentType<ThinkingIndicatorProps> | null
  SettingsPanel?: ComponentType<SettingsPanelProps> | null
  ToolsPanel?: ComponentType<ToolsPanelProps> | null
}
