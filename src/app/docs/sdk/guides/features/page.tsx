import Link from "next/link";
import { Sparkles, Copy, ThumbsUp, Clock, Group, Bell, Keyboard, Accessibility } from "lucide-react";
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
  title: "Built-in Features - WebMCP SDK Guide",
  description:
    "Code copy, message feedback, timestamps, grouping, keyboard shortcuts, and accessibility",
};

export default async function FeaturesPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Built-in Features</h1>
      <p className="text-muted-foreground mb-8">
        WebMCP ships with a set of UI features that are enabled by default or
        can be toggled with simple props.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Code copy */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Code Copy Button
          </h2>
          <p className="text-muted-foreground">
            A copy-to-clipboard button appears on every fenced code block in assistant responses.
            Enabled by default.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableCodeCopy</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show copy button on code blocks</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`// Disable code copy buttons
<WebMCPChat enableCodeCopy={false} />`}</CodeBlock>
        </section>

        {/* Message feedback */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            Message Feedback
          </h2>
          <p className="text-muted-foreground">
            Show thumbs-up / thumbs-down buttons on assistant messages. Use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">onFeedback</code> callback to
            capture the rating.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">enableFeedback</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show feedback buttons on assistant messages</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">onFeedback</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(messageId, rating) => void"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Callback fired when the user clicks a feedback button. Rating is{" "}
                    <code className="text-xs">&quot;up&quot;</code> or{" "}
                    <code className="text-xs">&quot;down&quot;</code>.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat
  enableFeedback={true}
  onFeedback={(messageId, rating) => {
    analytics.track('feedback', { messageId, rating });
  }}
/>`}</CodeBlock>
        </section>

        {/* Timestamps */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timestamps
          </h2>
          <p className="text-muted-foreground">
            Display a relative timestamp beneath each message.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">showTimestamps</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show timestamps on messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat showTimestamps={true} />`}</CodeBlock>
        </section>

        {/* Message grouping */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Message Grouping
          </h2>
          <p className="text-muted-foreground">
            Consecutive messages from the same role are visually grouped together with reduced
            spacing. Enabled by default.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">groupMessages</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Group consecutive same-role messages</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Notification badge */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Badge
          </h2>
          <p className="text-muted-foreground">
            When the chat overlay is closed, a badge on the floating button shows the number of
            unread messages. Enabled by default.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Prop</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">showUnreadBadge</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Show unread message count on floating button</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </h2>
          <p className="text-muted-foreground">
            The following keyboard shortcuts are available out of the box.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Shortcut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">Cmd/Ctrl + K</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Toggle the chat overlay open/closed</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Escape</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Close the chat overlay</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">Cmd/Ctrl + Shift + Backspace</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Reset the conversation</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility
          </h2>
          <p className="text-muted-foreground">
            The following accessibility features are always active and require no configuration.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Feature</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-sm">ARIA roles</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Semantic roles (<code className="text-xs">log</code>,{" "}
                    <code className="text-xs">textbox</code>,{" "}
                    <code className="text-xs">button</code>) for screen readers
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">aria-live</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    New messages are announced to assistive technologies via{" "}
                    <code className="text-xs">aria-live=&quot;polite&quot;</code>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">focus-visible</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Visible focus rings for keyboard navigation
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-sm">Reduced motion</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Animations are suppressed when{" "}
                    <code className="text-xs">prefers-reduced-motion</code> is set
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
