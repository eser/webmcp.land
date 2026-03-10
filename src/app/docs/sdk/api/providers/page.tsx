import Link from "next/link";
import { Server, ArrowLeft, Code, Cloud, Cpu, Globe } from "lucide-react";
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
  title: "Providers API Reference - webmcp.land",
  description:
    "Built-in and custom AI provider configuration for WebMCP React, including Anthropic, OpenAI, Google Gemini, and custom providers.",
};

export default function ProvidersApiPage() {
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
        <Server className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Providers</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        WebMCP React supports multiple AI providers out of the box and allows you to define custom providers for any OpenAI-compatible API.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Built-in Providers */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Built-in Providers
          </h2>
          <p className="text-muted-foreground">
            Three providers are available out of the box. Each includes a set of default models.
          </p>

          {/* Anthropic */}
          <div className="space-y-3">
            <h3 className="font-medium">Anthropic</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Model</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">claude-sonnet-4-6</TableCell>
                    <TableCell className="text-muted-foreground text-sm">High-performance balanced model</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">claude-haiku-4-5-20251001</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Fast and cost-effective</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">claude-opus-4-6</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Most capable model</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* OpenAI */}
          <div className="space-y-3">
            <h3 className="font-medium">OpenAI</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Model</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gpt-4.1</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Most capable GPT model</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gpt-4.1-mini</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Smaller, faster GPT-4.1 variant</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gpt-4o</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Multimodal GPT model</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">o3-mini</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Reasoning model</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Google Gemini */}
          <div className="space-y-3">
            <h3 className="font-medium">Google Gemini</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Model</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gemini-2.5-flash</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Fast and efficient</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gemini-2.5-pro</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Most capable Gemini model</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">gemini-2.0-flash</TableCell>
                    <TableCell className="text-muted-foreground text-sm">Previous generation fast model</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Users select their provider and model from the built-in settings panel. To restrict available providers, use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">providers</code> prop:
          </p>
          <CodeBlock>{`<WebMCPChat providers={['anthropic', 'openai']} />`}</CodeBlock>
        </section>

        {/* Custom Client-Side Provider */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Custom Client-Side Provider
          </h2>
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1.5 py-0.5 rounded text-sm">defineProvider()</code> to create a custom provider that runs entirely on the client side.
          </p>

          <CodeBlock>{`import { WebMCPChat, defineProvider } from 'webmcp-react'

const myProvider = defineProvider({
  name: 'my-llm',
  displayName: 'My LLM',
  models: ['my-model-v1', 'my-model-v2'],
  defaultModel: 'my-model-v1',
  sendMessage: async (params: SendMessageParams) => {
    const res = await fetch('https://api.my-llm.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${params.apiKey}\`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        tools: params.tools,
      }),
    })
    const data = await res.json()
    return {
      content: data.response,
      functionCalls: data.tool_calls,
    }
  },
})

<WebMCPChat
  providers={[myProvider]}
/>`}</CodeBlock>
        </section>

        {/* Custom Server-Side Provider */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Server-Side Provider
          </h2>
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createWebMCPProxy</code> with{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{`provider: 'custom'`}</code> and a{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">baseUrl</code> to proxy requests to any OpenAI-compatible API. Works with Together AI, Ollama, Groq, OpenRouter, and more.
          </p>

          <div className="space-y-3">
            <h3 className="font-medium">Together AI</h3>
            <CodeBlock title="app/api/webmcp/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server'

export const POST = createWebMCPProxy({
  provider: 'custom',
  baseUrl: 'https://api.together.xyz/v1',
  apiKey: process.env.TOGETHER_API_KEY!,
  model: 'meta-llama/Llama-3-70b-chat-hf',
})`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Ollama (Local)</h3>
            <CodeBlock title="app/api/webmcp/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server'

export const POST = createWebMCPProxy({
  provider: 'custom',
  baseUrl: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  model: 'llama3',
})`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Groq</h3>
            <CodeBlock title="app/api/webmcp/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server'

export const POST = createWebMCPProxy({
  provider: 'custom',
  baseUrl: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama3-70b-8192',
})`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">OpenRouter</h3>
            <CodeBlock title="app/api/webmcp/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server'

export const POST = createWebMCPProxy({
  provider: 'custom',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'anthropic/claude-sonnet-4-6',
})`}</CodeBlock>
          </div>

          <p className="text-muted-foreground text-sm">
            On the client side, connect to your proxy with managed mode:
          </p>
          <CodeBlock>{`<WebMCPChat proxyUrl="/api/webmcp" />`}</CodeBlock>
        </section>

        {/* Provider Interface */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Provider Interface
          </h2>
          <p className="text-muted-foreground">
            TypeScript interfaces for custom provider implementations.
          </p>

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
            <h3 className="font-medium">SendMessageParams</h3>
            <CodeBlock>{`interface SendMessageParams {
  messages: Message[]
  model: string
  apiKey: string
  tools?: ToolDefinition[]
  systemInstruction?: string
  maxTokens?: number
  temperature?: number
  onStreamToken?: (token: string) => void
}`}</CodeBlock>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">ProviderResponse</h3>
            <CodeBlock>{`interface ProviderResponse {
  content: string
  functionCalls?: FunctionCall[]
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
        </section>
      </div>
    </div>
  );
}
