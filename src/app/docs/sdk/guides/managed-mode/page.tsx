import Link from "next/link";
import { Shield, Server, Settings, Palette } from "lucide-react";
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
  title: "Managed Mode - WebMCP SDK Guide",
  description:
    "Keep API credentials server-side with managed mode. Compare BYOK vs Managed and learn how to set up a server proxy.",
};

export default async function ManagedModePage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Managed Mode</h1>
      <p className="text-muted-foreground mb-8">
        In managed mode, API credentials live on your server instead of the
        client. The user never sees or enters an API key&mdash;all LLM requests
        are proxied through your backend.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Comparison table */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            BYOK vs Managed
          </h2>
          <p className="text-muted-foreground">
            WebMCP supports two credential strategies. Choose the one that fits your use case.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Feature</TableHead>
                  <TableHead>BYOK (default)</TableHead>
                  <TableHead>Managed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-sm">API key location</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Client (user enters their own key)</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Server (your proxy holds the key)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">Settings panel</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Visible</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Hidden</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">Trace button</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Visible</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Hidden</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">LLM requests</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Client &rarr; LLM provider directly</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Client &rarr; your proxy &rarr; LLM provider</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">Wire format</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Provider-specific</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Always OpenAI Chat Completions</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Step 1: Server proxy */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5" />
            Step 1 &mdash; Create a Server Proxy
          </h2>
          <p className="text-muted-foreground">
            Use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createWebMCPProxy</code> from{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">webmcp-react/server</code> to
            create a proxy endpoint. The proxy always speaks the OpenAI Chat Completions format on
            the client side, regardless of which backend provider you use.
          </p>

          <CodeBlock title="app/api/chat/route.ts">{`// Anthropic backend
import { createWebMCPProxy } from 'webmcp-react/server';

export const POST = createWebMCPProxy({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});`}</CodeBlock>

          <CodeBlock>{`// Google Gemini backend
export const POST = createWebMCPProxy({
  provider: 'google',
  apiKey: process.env.GOOGLE_API_KEY!,
  model: 'gemini-2.0-flash',
});`}</CodeBlock>

          <CodeBlock>{`// Custom / OpenAI-compatible backend
export const POST = createWebMCPProxy({
  provider: 'custom',
  apiKey: process.env.TOGETHER_API_KEY!,
  baseUrl: 'https://api.together.xyz/v1',
  model: 'meta-llama/Llama-3-70b-chat-hf',
});`}</CodeBlock>
        </section>

        {/* Step 2: Client config */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 2 &mdash; Configure the Client
          </h2>
          <p className="text-muted-foreground">
            Point the chat component at your proxy. When{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">proxyUrl</code> is set,
            the component automatically enters managed mode — settings panel, API key input, and
            trace button are hidden, and the send button works immediately.
          </p>

          <CodeBlock>{`import { WebMCPChat } from 'webmcp-react';

export default function App() {
  return (
    <WebMCPChat proxyUrl="/api/chat" />
  );
}`}</CodeBlock>

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-3">
            <div>
              <p className="font-medium">Swap providers without client changes</p>
              <p className="text-muted-foreground">
                Because the proxy always speaks the OpenAI format to the client, you can change the
                backend provider (e.g. from Anthropic to Google) without touching any client code.
              </p>
            </div>
          </div>
        </section>

        {/* UI overrides */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            UI Customization Overrides
          </h2>
          <p className="text-muted-foreground">
            Managed mode hides settings and trace UI by default. You can override individual
            visibility flags if needed.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Prop</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[140px]">Managed Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">showSettingsButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the settings gear icon</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showTraceButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the request trace button</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`// Managed mode with custom logo and trace override
<WebMCPChat
  proxyUrl="/api/chat"
  logo="/my-logo.svg"
  showTraceButton={true}
/>`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
