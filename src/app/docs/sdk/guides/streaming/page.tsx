import Link from "next/link";
import { Radio, Layers, Paperclip, Image, Code } from "lucide-react";
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
  title: "Streaming, Context & Attachments - WebMCP SDK Guide",
  description:
    "Enable token-by-token streaming, manage context windows, and add file attachments",
};

export default async function StreamingPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">
        Streaming, Context &amp; Attachments
      </h1>
      <p className="text-muted-foreground mb-8">
        Control how responses are delivered, how much conversation history is
        sent, and how users can attach files.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Streaming */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Streaming
          </h2>
          <p className="text-muted-foreground">
            Set{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"streaming={true}"}</code> to
            display tokens as they arrive instead of waiting for the full response.
          </p>

          <CodeBlock>{`<WebMCPChat streaming={true} />`}</CodeBlock>

          <h3 className="font-medium">Provider Support</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Provider</TableHead>
                  <TableHead>Streaming Support</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">OpenAI</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Full (SSE)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Anthropic</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Full (SSE)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Google Gemini</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Fallback (non-streaming)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Stream callbacks */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Stream Callbacks &amp; Controls
          </h2>
          <p className="text-muted-foreground">
            Use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">onStreamToken</code> callback
            to observe each token as it arrives. When streaming is active a stop button
            automatically appears in the UI.
          </p>

          <CodeBlock>{`<WebMCPChat
  streaming={true}
  onStreamToken={(token) => {
    console.log('Token:', token);
  }}
/>`}</CodeBlock>

          <p className="text-muted-foreground">
            In{" "}
            <Link href="/docs/sdk/guides/headless-mode" className="underline hover:text-foreground">
              headless mode
            </Link>
            , access{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">isStreaming</code> and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">stop()</code> from the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">useWebMCPContext</code> hook.
          </p>

          <CodeBlock>{`import { useWebMCPContext } from 'webmcp-react';

function StreamControls() {
  const { isStreaming, stop } = useWebMCPContext();

  return isStreaming ? (
    <button onClick={stop}>Stop generating</button>
  ) : null;
}`}</CodeBlock>
        </section>

        {/* Context management */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Context Window Management
          </h2>
          <p className="text-muted-foreground">
            Use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">maxContextMessages</code> to
            limit how many recent messages are sent to the LLM. Older messages are kept in the UI
            but excluded from the API request to avoid exceeding context limits.
          </p>

          <CodeBlock>{`// Only send the last 20 messages to the LLM
<WebMCPChat maxContextMessages={20} />`}</CodeBlock>
        </section>

        {/* Attachments */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            File Attachments
          </h2>
          <p className="text-muted-foreground">
            Enable file attachments so users can upload images and documents alongside their
            messages.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Prop</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableAttachments</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show the attachment button in the input area</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">acceptedFileTypes</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Comma-separated MIME types (e.g. <code className="text-xs">&quot;image/*,application/pdf&quot;</code>)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat
  enableAttachments={true}
  acceptedFileTypes="image/*,application/pdf"
/>`}</CodeBlock>
        </section>

        {/* Image format */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Image Attachment Format
          </h2>
          <p className="text-muted-foreground">
            WebMCP automatically converts image attachments into the format expected by the
            current provider.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Provider</TableHead>
                  <TableHead>Format</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">OpenAI</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <code className="text-xs">image_url</code> content part with a data URI
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Anthropic</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <code className="text-xs">base64</code> content part with media type and data
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Programmatic attachments */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Programmatic Attachments
          </h2>
          <p className="text-muted-foreground">
            In headless mode, pass an attachment array to the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">send()</code> function.
          </p>

          <CodeBlock>{`const { send } = useWebMCP();

send('Describe this image', {
  attachments: [
    {
      type: 'image',
      mimeType: 'image/png',
      data: base64EncodedString,
    },
  ],
});`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
