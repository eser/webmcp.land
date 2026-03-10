import Link from "next/link";
import {
  Play,
  Wrench,
  Layers,
  Palette,
  Monitor,
  MessageSquareDashed,
  Server,
  Zap,
  Paperclip,
  Sparkles,
  Puzzle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "SDK Showcase - webmcp.land",
  description:
    "Interactive demos showing different WebMCP React SDK usage patterns — from zero-config to fully custom implementations.",
};

const demos = [
  {
    id: "drop-in",
    icon: Play,
    title: "Drop-in Component",
    desc: "Zero-config <WebMCPChat /> — floating chatbox appears in the bottom-right corner. Users configure provider and API key from built-in settings.",
    features: ["Floating chatbox", "Built-in settings panel", "Event callbacks"],
    code: `<WebMCPChat
  welcomeMessage="Hello! Configure your AI provider to begin."
  onMessage={(msg) => console.log(msg)}
/>`,
  },
  {
    id: "custom-tools",
    icon: Wrench,
    title: "Custom Tools",
    desc: "Three mock tools registered: get_weather, get_time, and calculator. The AI can call them during conversations, and users can test them from the tools panel.",
    features: ["defineTool()", "Tool panel", "Tool events", "JSON Schema input"],
    code: `const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
    },
    required: ['city'],
  },
  execute: async ({ city }) => {
    return JSON.stringify({ city, temperature: 22, condition: 'Sunny' })
  },
})

<WebMCPChat tools={[weatherTool, timeTool, calculatorTool]} />`,
  },
  {
    id: "headless",
    icon: Layers,
    title: "Headless Mode",
    desc: "Fully custom UI using WebMCPProvider + useWebMCPContext(). No default styling — complete control over rendering while keeping chat logic intact.",
    features: ["WebMCPProvider", "useWebMCPContext()", "Custom message rendering", "Custom input"],
    code: `<WebMCPProvider tools={[echoTool]}>
  <MyCustomChat />
</WebMCPProvider>

function MyCustomChat() {
  const { messages, send, reset, isLoading } = useWebMCPContext()
  // ... render your own UI
}`,
  },
  {
    id: "theme",
    icon: Palette,
    title: "Theme System",
    desc: "Side-by-side comparison of the built-in light theme and a custom indigo theme created with createTheme(). Shows the full theming API.",
    features: ["theme=\"light\"", "createTheme()", "Custom colors", "Custom fonts"],
    code: `const brand = createTheme({
  colors: {
    bg0: '#ffffff',
    bg1: '#f8f9fa',
    accent: '#6366f1',
    text0: '#111111',
    // ...
  },
})

<WebMCPChat theme={brand} displayMode="inline" />`,
  },
  {
    id: "slots",
    icon: Monitor,
    title: "Component Slots",
    desc: "Custom Header (gradient purple) and Message (rounded pills) components replace the defaults. The ToolsPanel is hidden by setting it to null.",
    features: ["Custom Header", "Custom Message", "Hide components with null"],
    code: `<WebMCPChat
  components={{
    Header: MyHeader,
    Message: MyMessage,
    ToolsPanel: null,
  }}
/>`,
  },
  {
    id: "inline",
    icon: MessageSquareDashed,
    title: "Inline Mode",
    desc: "Chat embedded directly in the page layout instead of floating. Useful for support pages, dashboards, or dedicated chat interfaces.",
    features: ["displayMode=\"inline\"", "Custom accent color", "Tool integration"],
    code: `<WebMCPChat
  displayMode="inline"
  headerTitle="Notebook"
  tools={[noteTool]}
  accentColor="#f59e0b"
/>`,
  },
  {
    id: "managed",
    icon: Server,
    title: "Managed Mode",
    desc: "Server-side credentials with custom branding. Settings panel and API key input are hidden. Send button works immediately — no user configuration needed.",
    features: ["proxyUrl", "Custom logo", "Light theme"],
    code: `<WebMCPChat
  proxyUrl="/api/webmcp"
  headerTitle="Acme Support"
  logo="https://example.com/logo.svg"
  theme="light"
/>`,
  },
  {
    id: "streaming",
    icon: Zap,
    title: "Streaming",
    desc: "SSE streaming with real-time token display. Stop button appears during generation. Tool calls also stream with immediate visual feedback.",
    features: ["streaming={true}", "Stop button", "onStreamToken", "Streaming tool calls"],
    code: `<WebMCPChat
  streaming={true}
  tools={[searchTool]}
  maxContextMessages={20}
  onStreamToken={(token) => console.log(token)}
/>`,
  },
  {
    id: "attachments",
    icon: Paperclip,
    title: "Attachments",
    desc: "File and image upload with multimodal AI. Paperclip icon appears in the input area. Images show as thumbnails before sending.",
    features: ["enableAttachments", "acceptedFileTypes", "Image previews", "Multimodal AI"],
    code: `<WebMCPChat
  enableAttachments={true}
  acceptedFileTypes="image/*"
  streaming={true}
/>`,
  },
  {
    id: "features",
    icon: Sparkles,
    title: "UI Features",
    desc: "All built-in UI features enabled: feedback buttons, timestamps, message grouping, unread badge, keyboard shortcuts, and code copy.",
    features: [
      "enableFeedback",
      "showTimestamps",
      "groupMessages",
      "enableCodeCopy",
      "showUnreadBadge",
      "enableKeyboardShortcuts",
    ],
    code: `<WebMCPChat
  enableFeedback={true}
  showTimestamps={true}
  groupMessages={true}
  enableCodeCopy={true}
  showUnreadBadge={true}
  enableKeyboardShortcuts={true}
  streaming={true}
/>`,
  },
  {
    id: "full-demo",
    icon: Puzzle,
    title: "Full Demo",
    desc: "Everything combined: streaming, tools, attachments, feedback, timestamps, grouping, unread badge, keyboard shortcuts, code copy, and a custom indigo theme.",
    features: [
      "All features enabled",
      "Custom theme",
      "Multiple tools",
      "Streaming + attachments",
    ],
    code: `<WebMCPChat
  streaming={true}
  tools={[weatherTool, calculatorTool]}
  enableAttachments={true}
  enableFeedback={true}
  showTimestamps={true}
  theme={customTheme}
  maxContextMessages={30}
/>`,
  },
];

export default function ShowcasePage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center gap-3 mb-2">
        <Play className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">SDK Showcase</h1>
      </div>
      <p className="text-muted-foreground mb-4">
        Interactive demos showing different WebMCP React SDK usage patterns. Each example demonstrates
        a specific feature or combination of features.
      </p>
      <p className="text-muted-foreground text-sm mb-10">
        To run these demos locally, clone the{" "}
        <Link
          href="https://github.com/nicejji/webmcp-react"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          webmcp-react
        </Link>{" "}
        repository and start the test app with{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">cd test-app && npm run dev</code>.
      </p>

      {/* Overview Table */}
      <div className="border rounded-lg overflow-hidden mb-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>Demo</TableHead>
              <TableHead>Key Features</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demos.map((demo, i) => (
              <TableRow key={demo.id}>
                <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                <TableCell className="font-medium text-sm">
                  <a href={`#${demo.id}`} className="hover:text-primary transition-colors">
                    {demo.title}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {demo.features.slice(0, 3).join(", ")}
                  {demo.features.length > 3 && ` +${demo.features.length - 3} more`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Demo Cards */}
      <div className="space-y-8">
        {demos.map((demo, i) => {
          const Icon = demo.icon;
          return (
            <section key={demo.id} id={demo.id} className="scroll-mt-20">
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm">
                      {i + 1}. {demo.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{demo.desc}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 border-b">
                  <p className="text-sm text-muted-foreground">{demo.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {demo.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Code */}
                <div className="bg-muted/50 p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap">{demo.code}</pre>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Server Proxy Example */}
      <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Server Proxy (for Managed Mode)</h2>
          <p className="text-muted-foreground text-sm">
            Demos 7 (Managed Mode) and others that use <code className="bg-muted px-1.5 py-0.5 rounded text-sm">proxyUrl</code>{" "}
            require a server proxy. Here is the test app&apos;s proxy that auto-detects the provider from
            environment variables:
          </p>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap">{`// app/api/webmcp/route.ts
import { createWebMCPProxy } from 'webmcp-react/server'

const provider = process.env.GOOGLE_API_KEY
  ? 'google'
  : process.env.OPENAI_API_KEY
    ? 'openai'
    : 'anthropic'

const apiKey =
  process.env.GOOGLE_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.ANTHROPIC_API_KEY || ''

const modelMap = {
  google: 'gemini-2.5-flash',
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-sonnet-4-6',
}

export const POST = createWebMCPProxy({
  provider,
  apiKey,
  model: modelMap[provider],
  maxTokens: 1024,
})`}</pre>
          </div>
        </section>
      </div>

      {/* Back to SDK Docs */}
      <div className="mt-10 pt-6 border-t">
        <Link
          href="/docs/sdk"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Back to SDK Documentation
        </Link>
      </div>
    </div>
  );
}
