import Link from "next/link";
import {
  Package,
  Wrench,
  Palette,
  Layers,
  Monitor,
  Server,
  Zap,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Code,
  type LucideIcon,
} from "lucide-react";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata = {
  title: "React SDK Documentation - webmcp.land",
  description:
    "WebMCP React — drop-in AI chatbox component for React with multi-provider support, tool execution, theming, and headless mode.",
};

const guides: { href: string; icon: LucideIcon; title: string; desc: string }[] = [
  {
    href: "/docs/sdk/guides/custom-tools",
    icon: Wrench,
    title: "Custom Tools",
    desc: "Define tools the AI can call during conversations",
  },
  {
    href: "/docs/sdk/guides/managed-mode",
    icon: Server,
    title: "Managed Mode",
    desc: "Server-side credentials for production deployments",
  },
  {
    href: "/docs/sdk/guides/theming",
    icon: Palette,
    title: "Theming",
    desc: "Dark/light presets, custom themes, CSS variables",
  },
  {
    href: "/docs/sdk/guides/headless-mode",
    icon: Layers,
    title: "Headless Mode",
    desc: "Use hooks directly for complete UI control",
  },
  {
    href: "/docs/sdk/guides/component-slots",
    icon: Monitor,
    title: "Component Slots",
    desc: "Replace any UI component with your own",
  },
  {
    href: "/docs/sdk/guides/streaming",
    icon: Zap,
    title: "Streaming & Attachments",
    desc: "Real-time streaming, context management, file uploads",
  },
  {
    href: "/docs/sdk/guides/features",
    icon: MessageSquare,
    title: "UI Features",
    desc: "Feedback, timestamps, grouping, keyboard shortcuts",
  },
  {
    href: "/docs/sdk/guides/server-proxy",
    icon: Server,
    title: "Server Proxy",
    desc: "OpenAI-compatible proxy with auth and rate limiting",
  },
];

const apiRef: { href: string; title: string; desc: string }[] = [
  {
    href: "/docs/sdk/api/webmcp-chat",
    title: "WebMCPChat",
    desc: "Full props reference for the main component",
  },
  {
    href: "/docs/sdk/api/hooks",
    title: "Hooks",
    desc: "useWebMCP, useMessages, useTools, WebMCPProvider",
  },
  {
    href: "/docs/sdk/api/providers",
    title: "Providers",
    desc: "Built-in and custom AI provider configuration",
  },
  {
    href: "/docs/sdk/api/types",
    title: "Types",
    desc: "All TypeScript type definitions",
  },
];

export default function SdkDocsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center gap-3 mb-2">
        <Package className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">WebMCP React SDK</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        A drop-in AI chatbox component for React and Next.js applications. Multi-provider support,
        tool execution, theming, component slots, and headless mode.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none mb-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Features</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Drop-in component</strong> — Add <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;WebMCPChat /&gt;</code> and get a working AI chatbox instantly</li>
            <li><strong>Multi-provider</strong> — Switch between Anthropic, OpenAI, and Google Gemini</li>
            <li><strong>Tool execution</strong> — Define custom tools with JSON Schema</li>
            <li><strong>Two credential modes</strong> — BYOK (Bring Your Own Key) or managed server-side</li>
            <li><strong>Fully themeable</strong> — Dark/light presets, custom themes, CSS variable overrides</li>
            <li><strong>Component slots</strong> — Replace any UI component with your own</li>
            <li><strong>Headless mode</strong> — Use hooks for complete UI control</li>
            <li><strong>Server proxy</strong> — Secure API route proxy to hide API keys</li>
            <li><strong>TypeScript-first</strong> — Full type definitions included</li>
          </ul>
        </section>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none mb-10 space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Start</h2>
          <CodeBlock>npm install webmcp-react</CodeBlock>
          <CodeBlock title="app.tsx">{`import { WebMCPChat } from 'webmcp-react'

export default function App() {
  return <WebMCPChat />
}`}</CodeBlock>
          <p className="text-muted-foreground text-sm">
            This renders a floating chat button. Users configure their AI provider and API key from the built-in settings panel.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Inline Mode</h2>
          <p className="text-muted-foreground text-sm">
            Embed the chat directly in your page layout instead of using a floating widget. Ideal for support pages, dashboards, or dedicated chat interfaces. The floating button is automatically hidden in inline mode.
          </p>
          <CodeBlock>{`<WebMCPChat
  displayMode="inline"
  width={420}
  height={550}
/>`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">With Custom Tools</h2>
          <CodeBlock>{`import { WebMCPChat, defineTool } from 'webmcp-react'

const weatherTool = defineTool({
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
    const res = await fetch(\`/api/weather?city=\${city}\`)
    return await res.json()
  },
})

<WebMCPChat tools={[weatherTool]} />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Server-Side Credentials (Managed Mode)</h2>
          <CodeBlock title="app/api/webmcp/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server'

export const POST = createWebMCPProxy({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-6',
})`}</CodeBlock>
          <CodeBlock title="Client">{`<WebMCPChat proxyUrl="/api/webmcp" />`}</CodeBlock>
        </section>
      </div>

      {/* Guides */}
      <h2 className="text-xl font-bold mb-4 mt-12">Guides</h2>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {guides.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.href}
              href={g.href}
              className="group flex items-start gap-3 rounded-lg border p-4 hover:border-foreground/20 hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-0.5 group-hover:text-foreground flex items-center gap-1">
                  {g.title}
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* API Reference */}
      <h2 className="text-xl font-bold mb-4">API Reference</h2>
      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {apiRef.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-start gap-3 rounded-lg border p-4 hover:border-foreground/20 hover:bg-muted/50 transition-colors"
          >
            <Code className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-0.5 group-hover:text-foreground flex items-center gap-1">
                {a.title}
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Showcase Link */}
      <Link
        href="/docs/sdk/showcase"
        className="group flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-5 hover:border-primary/40 hover:bg-primary/10 transition-colors"
      >
        <BookOpen className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h3 className="font-semibold group-hover:text-foreground flex items-center gap-1">
            SDK Showcase
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-sm text-muted-foreground">
            Interactive demos showing different usage patterns — from zero-config to fully custom.
          </p>
        </div>
      </Link>
    </div>
  );
}
