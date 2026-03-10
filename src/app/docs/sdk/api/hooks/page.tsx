import Link from "next/link";
import { ArrowLeft, Code, Layers, MessageSquare, Wrench } from "lucide-react";
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
  title: "Hooks API Reference - webmcp.land",
  description:
    "API reference for WebMCP React hooks: useWebMCP, useMessages, useTools, and WebMCPProvider context.",
};

export default function HooksApiPage() {
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
        <Code className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Hooks API</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        React hooks for headless mode and custom UI implementations. Use these hooks inside a{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;WebMCPProvider&gt;</code> to build fully custom chat interfaces.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* useWebMCP */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            useWebMCP()
          </h2>
          <p className="text-muted-foreground">
            The main hook that provides access to all chat functionality. Must be used inside a{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;WebMCPProvider&gt;</code>.
          </p>

          <CodeBlock>{`import { useWebMCP } from 'webmcp-react'

function MyChat() {
  const {
    send, isLoading, isStreaming, stop, reset,
    messages, tools, provider, model,
  } = useWebMCP()

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') send(e.currentTarget.value)
      }} />
    </div>
  )
}`}</CodeBlock>

          <h3 className="font-medium mt-6">Return Value</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Property</TableHead>
                  <TableHead className="w-[260px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">send</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(message: string) => Promise<void>`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Send a message to the AI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isLoading</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether a response is being generated</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isStreaming</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether a streaming response is in progress</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">stop</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Stop the current streaming response</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">reset</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Reset the conversation and clear messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">hasApiKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether an API key is configured</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isManaged</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether using managed credential mode</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">provider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current provider name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">model</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current model name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">messages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`Message[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">All conversation messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`ToolDefinition[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Registered tool definitions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">addMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(message: Partial<Message>) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Manually add a message to the conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">getTrace</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => TraceData`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Get debug trace data for the conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setProvider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(provider: string) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Switch the active provider</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setModel</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(model: string) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Switch the active model</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setApiKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(key: string) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Set the API key programmatically</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">availableProviders</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`ProviderDefinition[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">List of all available providers</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* useMessages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            useMessages()
          </h2>
          <p className="text-muted-foreground">
            A focused hook for message state management. Useful when you only need to read or manipulate messages.
          </p>

          <CodeBlock>{`import { useMessages } from 'webmcp-react'

function MessageList() {
  const { messages, addMessage, clearMessages } = useMessages()

  return (
    <div>
      {messages.map(m => <p key={m.id}>{m.content}</p>)}
      <button onClick={clearMessages}>Clear</button>
    </div>
  )
}`}</CodeBlock>

          <h3 className="font-medium mt-6">Return Value</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Property</TableHead>
                  <TableHead className="w-[260px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">messages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`Message[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">All conversation messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">addMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(message: Partial<Message>) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Add a message to the conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">clearMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`() => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Clear all messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* useTools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            useTools()
          </h2>
          <p className="text-muted-foreground">
            A focused hook for tool management. Access registered tools and execute them manually.
          </p>

          <CodeBlock>{`import { useTools } from 'webmcp-react'

function ToolsList() {
  const { tools, executeTool } = useTools()

  return (
    <ul>
      {tools.map(t => (
        <li key={t.name}>
          {t.name}: {t.description}
          <button onClick={() => executeTool(t.name, {})}>Run</button>
        </li>
      ))}
    </ul>
  )
}`}</CodeBlock>

          <h3 className="font-medium mt-6">Return Value</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Property</TableHead>
                  <TableHead className="w-[300px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`ToolDefinition[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">All registered tool definitions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">executeTool</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(name: string, args: Record<string, unknown>) => Promise<unknown>`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Execute a tool by name with the given arguments</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* WebMCPProvider */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            WebMCPProvider
          </h2>
          <p className="text-muted-foreground">
            The context provider that powers all hooks. Wrap your custom chat UI with this component to use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">useWebMCP</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">useMessages</code>, and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">useTools</code>.
          </p>

          <CodeBlock>{`import { WebMCPProvider, useWebMCP } from 'webmcp-react'

function App() {
  return (
    <WebMCPProvider
      tools={myTools}
      streaming
      onMessage={(msg) => console.log(msg)}
      onError={(err) => console.error(err)}
    >
      <MyCustomChat />
    </WebMCPProvider>
  )
}`}</CodeBlock>

          <h3 className="font-medium mt-6">Props</h3>
          <p className="text-muted-foreground text-sm">
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">WebMCPProvider</code> accepts the same provider configuration, tools, streaming, and event props as{" "}
            <Link href="/docs/sdk/api/webmcp-chat" className="underline hover:text-foreground">WebMCPChat</Link>.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[260px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">provider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">AI provider name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">model</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Model to use</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`ToolDefinition[]`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Tool definitions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">proxyUrl</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Server proxy URL</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">streaming</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Enable streaming</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">systemInstruction</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">System instruction</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(message: Message) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Message callback</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onToolCall</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(call: FunctionCall) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Tool call callback</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onToolResult</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(result: ToolResult) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Tool result callback</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onError</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{`(error: Error) => void`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Error callback</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">children</TableCell>
                  <TableCell className="text-muted-foreground text-xs">ReactNode</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Child components that can use hooks</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
