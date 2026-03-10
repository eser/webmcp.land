import Link from "next/link";
import { MessageSquare, Settings, Palette, Maximize2, Zap, Paperclip, ThumbsUp, Keyboard, Layers, Code, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata = {
  title: "WebMCPChat Props Reference - webmcp.land",
  description:
    "Complete props reference for the WebMCPChat React component including provider configuration, tools, theming, events, and component slots.",
};

export default function WebMCPChatApiPage() {
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
        <MessageSquare className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">WebMCPChat Props</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Complete props reference for the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;WebMCPChat /&gt;</code> component.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Provider Configuration */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Provider Configuration
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">providers</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string[]</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`['google', 'openai', 'anthropic']`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Available providers shown in settings</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">systemInstruction</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">System instruction prepended to every conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">proxyUrl</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Server proxy URL — when set, credentials are managed server-side (settings panel and API key input are hidden automatically)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Tools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Tools
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`ToolDefinition[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">[]</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Array of tool definitions the AI can call during conversations</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* UI */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            UI
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[220px]">Type</TableHead>
                  <TableHead className="w-[140px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">displayMode</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'bottom-right' | 'bottom-left' | 'inline'`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'bottom-right'`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Chat display mode — floating or inline</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">defaultOpen</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Open chat on mount</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showToolsPanel</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the tools panel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showSettingsPanel</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the settings panel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showFloatingButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true (auto-false in inline)</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the floating trigger button (automatically hidden in inline mode)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showSettingsButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show settings button in header</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showToolsButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show tools button in header</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showResetButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show reset conversation button</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showTraceButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show trace/debug button</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">headerTitle</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'WebMCP'`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Header title text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">headerSubtitle</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'Online'`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Header subtitle text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">placeholder</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'Message WebMCP...'`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Input field placeholder text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">welcomeMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Initial assistant message shown on first open</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">logo</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`string | ReactNode`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Header logo (URL string or React element)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">floatingIcon</TableCell>
                  <TableCell className="text-muted-foreground text-xs">ReactNode</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Custom icon for the floating button</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Theme */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">theme</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'dark' | 'light' | Theme`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`'dark'`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Theme preset or custom Theme object</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">accentColor</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Override the accent color (CSS color value)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">borderRadius</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Override border radius in pixels</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">fontFamily</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Override the font family</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Dimensions */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            Dimensions
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">width</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">400</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Chatbox width in pixels</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">height</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">600</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Chatbox height in pixels</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Streaming & Attachments */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Streaming & Attachments
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">streaming</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Enable streaming responses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxContextMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum number of messages to include in context</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableAttachments</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Enable file attachments</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">acceptedFileTypes</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Accepted file MIME types (e.g. &quot;image/*,.pdf&quot;)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* UI Features */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            UI Features
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Prop</TableHead>
                  <TableHead className="w-[160px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableFeedback</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show thumbs up/down on assistant messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableCodeCopy</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show copy button on code blocks</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showTimestamps</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show message timestamps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">groupMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Group consecutive messages from the same sender</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showUnreadBadge</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show unread message badge on floating button</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableKeyboardShortcuts</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Enable keyboard shortcuts (Esc to close, etc.)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Events */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Events
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[280px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">onMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(message: Message) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when a new message is added</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onToolCall</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(call: FunctionCall) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when the AI invokes a tool</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onToolResult</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(result: ToolResult) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when a tool returns a result</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onError</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(error: Error) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called on any error</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onOpen</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when the chat opens</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onClose</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when the chat closes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onProviderChange</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(provider: string) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when the user switches providers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onStreamToken</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(token: string) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called for each streaming token</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onFeedback</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(messageId: string, type: 'up' | 'down') => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Called when the user gives feedback</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Advanced */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Advanced
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxTokens</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum tokens for AI responses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">temperature</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Temperature for AI responses (0-2)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">initialMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`Message[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Pre-populated conversation messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">persistMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Persist messages to localStorage</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">storageKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-xs">---</TableCell>
                  <TableCell className="text-muted-foreground text-sm">localStorage key for persisted messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Component Slots */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Component Slots
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">components</TableCell>
                  <TableCell className="text-muted-foreground text-xs">ComponentSlots</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Override any UI component with your own implementation</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="text-muted-foreground text-sm">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">ComponentSlots</code> interface allows you to replace individual UI sections:
          </p>

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
        </section>

        {/* Examples */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Examples</h2>

          <div className="space-y-4">
            <h3 className="font-medium">Minimal</h3>
            <CodeBlock title="app.tsx">{`import { WebMCPChat } from 'webmcp-react'

export default function App() {
  return <WebMCPChat />
}`}</CodeBlock>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Production</h3>
            <CodeBlock title="app.tsx">{`import { WebMCPChat, defineTool } from 'webmcp-react'

const tools = [
  defineTool({
    name: 'search_docs',
    description: 'Search documentation',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
    execute: async ({ query }) => {
      const res = await fetch(\`/api/search?q=\${query}\`)
      return res.json()
    },
  }),
]

export default function App() {
  return (
    <WebMCPChat
      proxyUrl="/api/webmcp"
      tools={tools}
      streaming
      theme="dark"
      headerTitle="Support"
      headerSubtitle="We're here to help"
      welcomeMessage="Hi! How can I help you today?"
      enableFeedback
      showTimestamps
      onError={(err) => console.error(err)}
      onFeedback={(id, type) => analytics.track('feedback', { id, type })}
    />
  )
}`}</CodeBlock>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Inline</h3>
            <CodeBlock title="chat-page.tsx">{`import { WebMCPChat } from 'webmcp-react'

export default function ChatPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <WebMCPChat
        displayMode="inline"
        width={500}
        height={700}
      />
    </div>
  )
}`}</CodeBlock>
          </div>
        </section>
      </div>
    </div>
  );
}
