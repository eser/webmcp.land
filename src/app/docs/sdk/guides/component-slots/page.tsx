import Link from "next/link";
import { Puzzle, Layout, EyeOff, Code } from "lucide-react";
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
  title: "Component Slots - WebMCP SDK Guide",
  description:
    "Replace or hide individual UI sections using the component slot system",
};

export default async function ComponentSlotsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Component Slots</h1>
      <p className="text-muted-foreground mb-8">
        The slot system lets you swap out individual pieces of the chat UI with
        your own React components, or hide them entirely by setting a slot to{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">null</code>.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Using the components Prop
          </h2>
          <p className="text-muted-foreground">
            Pass an object of replacement components via the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">components</code> prop. Each
            key maps to a named slot in the default UI. Your component receives the same props the
            default implementation would receive.
          </p>

          <CodeBlock>{`import { WebMCPChat } from 'webmcp-react';
import { MyHeader } from './MyHeader';
import { MyMessage } from './MyMessage';

<WebMCPChat
  components={{
    Header: MyHeader,
    Message: MyMessage,
  }}
/>`}</CodeBlock>
        </section>

        {/* Available slots */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Available Slots
          </h2>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Slot</TableHead>
                  <TableHead className="w-[220px]">Props Interface</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">Header</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">ChatHeaderProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Top bar with title, settings button, and reset button</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Message</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">ChatMessageProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Individual chat message bubble</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Input</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">ChatInputProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Text input area with send button</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">FloatingButton</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">FloatingButtonProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Toggle button that opens the chat overlay</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">ThinkingIndicator</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">{"{}"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Loading indicator shown while the LLM is responding</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">SettingsPanel</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">SettingsPanelProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Panel for API key, provider, and model selection</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">ToolsPanel</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">ToolsPanelProps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Panel listing registered tools and their schemas</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Hiding slots */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Hiding a Slot
          </h2>
          <p className="text-muted-foreground">
            Set any slot to{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">null</code> to remove it from
            the UI entirely.
          </p>

          <CodeBlock>{`// Hide the header and settings panel
<WebMCPChat
  components={{
    Header: null,
    SettingsPanel: null,
  }}
/>`}</CodeBlock>
        </section>

        {/* Props interfaces */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Slot Props Reference
          </h2>

          <h3 className="font-medium">ChatHeaderProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">title</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Chat title text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onReset</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to reset the conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onToggleSettings</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to open/close the settings panel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">logo</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string | undefined</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Optional logo URL</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">ChatInputProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">onSend</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(text: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Send a message</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isLoading</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether the LLM is currently responding</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">disabled</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether input is disabled (e.g. no API key)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">placeholder</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Placeholder text for the input field</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">ChatMessageProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">message</TableCell>
                  <TableCell className="text-muted-foreground text-xs">Message</TableCell>
                  <TableCell className="text-muted-foreground text-sm">The message object (id, role, content, timestamp)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isLast</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether this is the last message in the list</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">FloatingButtonProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">isOpen</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether the chat overlay is open</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onClick</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Toggle the chat overlay</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">unreadCount</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Number of unread messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">SettingsPanelProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">provider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current provider</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">model</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current model</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onProviderChange</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(p: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to change provider</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onModelChange</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(m: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to change model</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onApiKeyChange</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(k: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to set the API key</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">ToolsPanelProps</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"Tool[]"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Array of registered tool definitions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onClose</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Callback to close the tools panel</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Example custom components */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Example: Custom Header
          </h2>

          <CodeBlock title="MyHeader.tsx">{`import type { ChatHeaderProps } from 'webmcp-react';

function MyHeader({ title, onReset, logo }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        {logo && <img src={logo} alt="" className="h-6" />}
        <h1 className="font-semibold">{title}</h1>
      </div>
      <button onClick={onReset}>New Chat</button>
    </header>
  );
}`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Example: Custom Message
          </h2>

          <CodeBlock title="MyMessage.tsx">{`import type { ChatMessageProps } from 'webmcp-react';

function MyMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';
  return (
    <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'}\`}>
      <div className={\`rounded-lg px-4 py-2 max-w-[80%] \${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
      }\`}>
        {message.content}
      </div>
    </div>
  );
}`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
