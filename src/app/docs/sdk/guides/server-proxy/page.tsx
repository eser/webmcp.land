import Link from "next/link";
import { Server, Shield, Globe, Lock, Gauge, Settings } from "lucide-react";
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
  title: "Server Proxy - WebMCP SDK Guide",
  description:
    "Create a secure server proxy with createWebMCPProxy, supporting OpenAI, Anthropic, Gemini, and custom backends",
};

export default async function ServerProxyPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Server Proxy</h1>
      <p className="text-muted-foreground mb-8">
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createWebMCPProxy</code> creates
        a server-side route handler that proxies LLM requests. The client always
        sends and receives the OpenAI Chat Completions format; the proxy
        auto-translates to the target backend.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5" />
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Import{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createWebMCPProxy</code> from{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">webmcp-react/server</code> and
            export it as a route handler. The proxy always accepts and returns the OpenAI Chat
            Completions format on the wire, regardless of which backend provider is configured.
          </p>

          <CodeBlock title="app/api/chat/route.ts">{`import { createWebMCPProxy } from 'webmcp-react/server';

export const POST = createWebMCPProxy({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});`}</CodeBlock>
        </section>

        {/* Supported backends */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Supported Backends
          </h2>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Provider</TableHead>
                  <TableHead>Behavior</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">openai</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Direct pass-through (native format)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">anthropic</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Auto-translates to/from Anthropic Messages API</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">google</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Auto-translates to/from Gemini API</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">custom</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Any OpenAI-compatible endpoint via{" "}
                    <code className="text-xs">baseUrl</code>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">Examples</h3>

          <CodeBlock>{`// Together AI
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: process.env.TOGETHER_API_KEY!,
  baseUrl: 'https://api.together.xyz/v1',
  model: 'meta-llama/Llama-3-70b-chat-hf',
});`}</CodeBlock>

          <CodeBlock>{`// Ollama (local)
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: 'ollama',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3',
});`}</CodeBlock>

          <CodeBlock>{`// Groq
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: process.env.GROQ_API_KEY!,
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama3-70b-8192',
});`}</CodeBlock>

          <CodeBlock>{`// OpenRouter
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-sonnet-4-20250514',
});`}</CodeBlock>

          <CodeBlock>{`// Azure OpenAI
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseUrl: 'https://my-resource.openai.azure.com/openai/deployments/gpt-4o/v1',
  model: 'gpt-4o',
});`}</CodeBlock>
        </section>

        {/* Full config */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Full Configuration Reference
          </h2>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Option</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">provider</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <code className="text-xs">&quot;openai&quot;</code> |{" "}
                    <code className="text-xs">&quot;anthropic&quot;</code> |{" "}
                    <code className="text-xs">&quot;google&quot;</code> |{" "}
                    <code className="text-xs">&quot;custom&quot;</code>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">apiKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">API key for the backend provider</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">model</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Model identifier (server-side override; client cannot change this)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">baseUrl</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Base URL for custom / self-hosted endpoints</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxTokens</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum tokens in the LLM response</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxMessageLength</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum character length of a single user message</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum number of messages per request</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">maxTools</TableCell>
                  <TableCell className="text-muted-foreground text-xs">number</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Maximum number of tools the client can register</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">systemInstruction</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">System prompt prepended to every request</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">authorize</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(req) => Promise<boolean>"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Async callback to authorize the request</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">rateLimiter</TableCell>
                  <TableCell className="text-muted-foreground text-xs">RateLimiter</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Rate limiter instance (e.g. Redis-backed)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">rateLimitKey</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(req) => string"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Function to derive the rate limit key from the request</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">allowedOrigins</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string[]</TableCell>
                  <TableCell className="text-muted-foreground text-sm">CORS allowed origins</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </h2>
          <p className="text-muted-foreground">
            The proxy enforces several security measures by default.
          </p>

          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              <strong>Input allowlisting</strong> &mdash; The client cannot set{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">model</code>,{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">max_tokens</code>, or{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">system</code>. These are
              always set server-side.
            </li>
            <li>
              <strong>Error sanitization</strong> &mdash; Internal errors and stack traces are never
              exposed to the client.
            </li>
            <li>
              <strong>Validation</strong> &mdash; Message structure, tool schemas, and payload size
              are validated before forwarding.
            </li>
          </ul>
        </section>

        {/* Auth example */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication Example
          </h2>
          <p className="text-muted-foreground">
            Use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">authorize</code> callback to
            restrict access. Return{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">true</code> to allow the
            request or <code className="bg-muted px-1.5 py-0.5 rounded text-sm">false</code> to
            reject it with a 401.
          </p>

          <CodeBlock>{`export const POST = createWebMCPProxy({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
  authorize: async (req) => {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return false;
    const session = await verifyToken(token);
    return !!session;
  },
});`}</CodeBlock>
        </section>

        {/* Rate limiting */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Rate Limiting
          </h2>
          <p className="text-muted-foreground">
            Pass a rate limiter instance and a key derivation function to throttle requests per
            user, IP, or any other dimension.
          </p>

          <CodeBlock>{`import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export const POST = createWebMCPProxy({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  rateLimiter: ratelimit,
  rateLimitKey: (req) => {
    return req.headers.get('x-forwarded-for') ?? 'anonymous';
  },
});`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
