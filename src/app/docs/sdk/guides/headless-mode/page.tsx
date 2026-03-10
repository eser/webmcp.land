import Link from "next/link";
import { Code, Layers, MessageSquare, Wrench, Settings } from "lucide-react";
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
  title: "Headless Mode - WebMCP SDK Guide",
  description:
    "Build a fully custom chat UI using WebMCP hooks: useWebMCP, useMessages, and useTools",
};

export default async function HeadlessModePage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Headless Mode</h1>
      <p className="text-muted-foreground mb-8">
        Headless mode gives you the full power of WebMCP&mdash;message
        management, tool execution, streaming, and provider abstraction&mdash;without
        any built-in UI. Use React hooks to build your own chat interface from
        scratch.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Provider setup */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Setting Up the Provider
          </h2>
          <p className="text-muted-foreground">
            Wrap your application (or the relevant subtree) with{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"<WebMCPProvider>"}</code>.
            The provider accepts the same props as{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"<WebMCPChat>"}</code> for
            configuring providers, tools, and event callbacks.
          </p>

          <CodeBlock>{`import { WebMCPProvider } from 'webmcp-react';

export default function App() {
  return (
    <WebMCPProvider
      tools={[calculator, weatherTool]}
      onMessage={(msg) => console.log('New message:', msg)}
    >
      <MyChatUI />
    </WebMCPProvider>
  );
}`}</CodeBlock>
        </section>

        {/* useWebMCP */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            useWebMCP()
          </h2>
          <p className="text-muted-foreground">
            The primary hook for building a custom chat UI. It returns everything
            you need to send messages, inspect state, and control the
            conversation.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Property</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">send</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(text: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Send a user message and trigger LLM response</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isLoading</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">True while waiting for LLM response</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">reset</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Clear all messages and reset the conversation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">hasApiKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Whether an API key is configured</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">isManaged</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">True if running in managed credential mode</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">provider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current provider name</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">model</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current model identifier</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">messages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"Message[]"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Full array of conversation messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">tools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"Tool[]"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Registered tool definitions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">addMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(msg: Message) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Manually add a message without triggering LLM</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">getTrace</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => Trace"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Get the raw request/response trace for debugging</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setProvider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(p: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Switch provider at runtime</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setModel</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(m: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Switch model at runtime</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">setApiKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(key: string) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Set the API key programmatically</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`import { useWebMCP } from 'webmcp-react';

function MyChatUI() {
  const { send, messages, isLoading, reset } = useWebMCP();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    send(input);
    setInput('');
  };

  return (
    <div>
      <div>
        {messages.map((m) => (
          <div key={m.id} className={m.role}>
            {m.content}
          </div>
        ))}
        {isLoading && <div>Thinking...</div>}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`}</CodeBlock>
        </section>

        {/* useMessages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            useMessages()
          </h2>
          <p className="text-muted-foreground">
            A focused hook for reading and manipulating the message list.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Property</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">messages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"Message[]"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Current conversation messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">addMessage</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(msg: Message) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Add a message to the list</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">clearMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"() => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Remove all messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`import { useMessages } from 'webmcp-react';

function MessageList() {
  const { messages, clearMessages } = useMessages();

  return (
    <div>
      {messages.map((m) => <p key={m.id}>{m.content}</p>)}
      <button onClick={clearMessages}>Clear</button>
    </div>
  );
}`}</CodeBlock>
        </section>

        {/* useTools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            useTools()
          </h2>
          <p className="text-muted-foreground">
            Access registered tools and execute them programmatically.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Property</TableHead>
                  <TableHead className="w-[260px]">Type</TableHead>
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
                  <TableCell className="font-mono text-xs">executeTool</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(name: string, args: object) => Promise<string>"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Execute a tool by name with the given arguments</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`import { useTools } from 'webmcp-react';

function ToolRunner() {
  const { tools, executeTool } = useTools();

  return (
    <ul>
      {tools.map((t) => (
        <li key={t.name}>
          {t.name} &mdash; {t.description}
        </li>
      ))}
    </ul>
  );
}`}</CodeBlock>
        </section>

        {/* Provider props */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            WebMCPProvider Props
          </h2>
          <p className="text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"<WebMCPProvider>"}</code>{" "}
            accepts the same configuration props as{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"<WebMCPChat>"}</code>,
            including tools, event callbacks, proxy URL, theme,
            and streaming settings. See the individual guide pages for details on each prop.
          </p>

          <CodeBlock>{`<WebMCPProvider
  tools={[calculator]}
  streaming={true}
  proxyUrl="/api/chat"
  onMessage={(msg) => analytics.track('message', msg)}
  onToolCall={(name, args) => logger.info('tool', { name, args })}
>
  <MyChatUI />
</WebMCPProvider>`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
