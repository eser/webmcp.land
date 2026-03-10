import Link from "next/link";
import { FileCode, ArrowLeft, Code, MessageSquare, Wrench, Palette, Layers } from "lucide-react";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata = {
  title: "TypeScript Types Reference - webmcp.land",
  description:
    "Complete TypeScript type definitions for WebMCP React: Message, ToolDefinition, Theme, Provider, and component prop types.",
};

export default function TypesApiPage() {
  return (
    <div className="container max-w-4xl py-10">
      <Link
        href="/docs/sdk"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to SDK
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <FileCode className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">TypeScript Types</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        All TypeScript type definitions exported from <code className="bg-muted px-1.5 py-0.5 rounded text-sm">webmcp-react</code>.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Messages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">Message</h3>
            <CodeBlock>{`interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: number
  isStreaming?: boolean
  attachments?: MessageAttachment[]
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">MessageType</h3>
            <CodeBlock>{`type MessageType =
  | 'user'
  | 'assistant'
  | 'tool-call'
  | 'tool-result'
  | 'error'
  | 'system'
  | 'thinking'`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">MessageAttachment</h3>
            <CodeBlock>{`interface MessageAttachment {
  type: 'image' | 'file' | 'audio' | 'video'
  name: string
  url: string
  mimeType: string
}`}</CodeBlock>
          </div>
        </section>

        {/* Streaming */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Streaming
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">StreamCallback</h3>
            <CodeBlock>{`type StreamCallback = (token: string) => void`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">StreamResult</h3>
            <CodeBlock>{`interface StreamResult {
  content: string
  functionCalls?: FunctionCall[]
  aborted?: boolean
}`}</CodeBlock>
          </div>
        </section>

        {/* Tools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Tools
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">ToolDefinition</h3>
            <CodeBlock>{`interface ToolDefinition {
  name: string
  description: string
  inputSchema: JSONSchema
  execute: (args: Record<string, unknown>) => Promise<unknown>
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">JSONSchema</h3>
            <CodeBlock>{`interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array'
  properties?: Record<string, {
    type: string
    description?: string
    enum?: string[]
    items?: JSONSchema
    default?: unknown
  }>
  required?: string[]
  description?: string
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">FunctionCall</h3>
            <CodeBlock>{`interface FunctionCall {
  name: string
  args: Record<string, unknown>
  id: string
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ToolResult</h3>
            <CodeBlock>{`interface ToolResult {
  name: string
  result: unknown
  callId: string
}`}</CodeBlock>
          </div>
        </section>

        {/* Providers */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Providers
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">ProviderDefinition</h3>
            <CodeBlock>{`interface ProviderDefinition {
  name: string
  displayName: string
  models: string[]
  defaultModel: string
  sendMessage: (params: SendMessageParams) => Promise<ProviderResponse>
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ProviderResponse</h3>
            <CodeBlock>{`interface ProviderResponse {
  content: string
  functionCalls?: FunctionCall[]
}`}</CodeBlock>
          </div>
        </section>

        {/* Theme */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">Theme</h3>
            <CodeBlock>{`interface Theme {
  name: string
  colors: ThemeColors
  borderRadius?: number
  fontFamily?: string
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ThemeColors</h3>
            <CodeBlock>{`interface ThemeColors {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
}`}</CodeBlock>
          </div>
        </section>

        {/* Credential Mode */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Credential Mode
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium">CredentialMode</h3>
            <CodeBlock>{`type CredentialMode = 'byok' | 'managed'`}</CodeBlock>
            <p className="text-muted-foreground text-sm">
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">byok</code> (Bring Your Own Key) — users provide their own API key via the settings panel.{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">managed</code> — API keys are managed server-side via a proxy.
            </p>
          </div>
        </section>

        {/* Component Prop Types */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Component Prop Types
          </h2>
          <p className="text-muted-foreground">
            Prop types for{" "}
            <Link href="/docs/sdk/api/webmcp-chat" className="underline hover:text-foreground">component slots</Link>.
            Use these when building custom component replacements.
          </p>

          <div className="space-y-3">
            <h3 className="font-medium">ChatHeaderProps</h3>
            <CodeBlock>{`interface ChatHeaderProps {
  title: string
  subtitle: string
  logo?: string | React.ReactNode
  onClose: () => void
  onSettings: () => void
  onTools: () => void
  onReset: () => void
  showSettingsButton: boolean
  showToolsButton: boolean
  showResetButton: boolean
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ChatInputProps</h3>
            <CodeBlock>{`interface ChatInputProps {
  onSend: (message: string) => void
  placeholder: string
  isLoading: boolean
  isStreaming: boolean
  onStop: () => void
  enableAttachments: boolean
  acceptedFileTypes?: string
  onAttach?: (files: File[]) => void
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">FloatingButtonProps</h3>
            <CodeBlock>{`interface FloatingButtonProps {
  onClick: () => void
  isOpen: boolean
  unreadCount: number
  icon?: React.ReactNode
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ChatMessageProps</h3>
            <CodeBlock>{`interface ChatMessageProps {
  message: Message
  showTimestamp: boolean
  enableFeedback: boolean
  enableCodeCopy: boolean
  onFeedback?: (type: 'up' | 'down') => void
  isGrouped: boolean
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">SettingsPanelProps</h3>
            <CodeBlock>{`interface SettingsPanelProps {
  provider: string
  model: string
  availableProviders: ProviderDefinition[]
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
  onApiKeyChange: (key: string) => void
  hasApiKey: boolean
  isManaged: boolean
  onClose: () => void
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ToolsPanelProps</h3>
            <CodeBlock>{`interface ToolsPanelProps {
  tools: ToolDefinition[]
  onClose: () => void
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ComponentSlots</h3>
            <CodeBlock>{`interface ComponentSlots {
  Header?: React.ComponentType<ChatHeaderProps>
  Input?: React.ComponentType<ChatInputProps>
  Message?: React.ComponentType<ChatMessageProps>
  FloatingButton?: React.ComponentType<FloatingButtonProps>
  SettingsPanel?: React.ComponentType<SettingsPanelProps>
  ToolsPanel?: React.ComponentType<ToolsPanelProps>
  EmptyState?: React.ComponentType
  LoadingIndicator?: React.ComponentType
  ErrorBoundary?: React.ComponentType<{ error: Error }>
}`}</CodeBlock>
          </div>
        </section>
      </div>
    </div>
  );
}
