import Link from "next/link";
import { Wrench, Code, Zap, Settings, Eye, Terminal } from "lucide-react";
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
  title: "Custom Tools - WebMCP SDK Guide",
  description:
    "Define custom tools with defineTool(), input schemas, async execution, tool events, and the tools panel",
};

export default async function CustomToolsPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Custom Tools</h1>
      <p className="text-muted-foreground mb-8">
        Define type-safe tool definitions that LLMs can discover and invoke
        during a conversation. Tools let you extend the chat with external
        capabilities such as API calls, database lookups, calculations, and
        more.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* defineTool */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            defineTool()
          </h2>
          <p className="text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">defineTool()</code> creates a
            type-safe tool definition that can be passed to the chat component or
            used in headless mode.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Field</TableHead>
                  <TableHead className="w-[180px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">name</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Unique identifier for the tool. Used by the LLM to select it.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">description</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Human-readable description the LLM reads to decide when to call the tool.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">inputSchema</TableCell>
                  <TableCell className="text-muted-foreground text-xs">JSONSchema</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    JSON Schema object describing the expected arguments.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">execute</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{"(args) => Promise<string>"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Async function that runs when the LLM invokes the tool. Must return a string.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock title="calculator.ts">{`// Define a calculator tool
import { defineTool } from 'webmcp-react';

const calculator = defineTool({
  name: 'calculator',
  description: 'Perform basic arithmetic operations',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform',
      },
      a: { type: 'number', description: 'First operand' },
      b: { type: 'number', description: 'Second operand' },
    },
    required: ['operation', 'a', 'b'],
  },
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':      return String(a + b);
      case 'subtract': return String(a - b);
      case 'multiply': return String(a * b);
      case 'divide':   return String(a / b);
      default:         return 'Unknown operation';
    }
  },
});`}</CodeBlock>
        </section>

        {/* Passing tools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Passing Tools to the Chat Component
          </h2>
          <p className="text-muted-foreground">
            Pass an array of tool definitions to the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">tools</code> prop on{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"<WebMCPChat />"}</code>.
          </p>

          <CodeBlock>{`import { WebMCPChat } from 'webmcp-react';

export default function App() {
  return (
    <WebMCPChat
      tools={[calculator, weatherTool]}
    />
  );
}`}</CodeBlock>
        </section>

        {/* Input Schema */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Input Schema (JSON Schema)
          </h2>
          <p className="text-muted-foreground">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">inputSchema</code> follows
            the{" "}
            <Link
              href="https://json-schema.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              JSON Schema
            </Link>{" "}
            specification. You can use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">properties</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">required</code>, and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">enum</code> to describe the
            shape of the arguments the LLM should generate.
          </p>

          <CodeBlock>{`// JSON Schema with enum and optional fields
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name (e.g. "London")',
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
      },
    },
    required: ['city'],
  },
  execute: async ({ city, units }) => {
    const res = await fetch(\`https://api.weather.com/\${city}?units=\${units ?? 'celsius'}\`);
    const data = await res.json();
    return JSON.stringify(data);
  },
});`}</CodeBlock>
        </section>

        {/* Async tools */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Async Tools
          </h2>
          <p className="text-muted-foreground">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">execute</code> function is
            always async. You can make API calls, perform database lookups, or run any asynchronous
            operation. The function must return a string that will be fed back to the LLM as the tool
            result.
          </p>

          <CodeBlock>{`// Async tool with API call and DB lookup
const lookupUser = defineTool({
  name: 'lookup_user',
  description: 'Look up a user by email address',
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'User email address' },
    },
    required: ['email'],
  },
  execute: async ({ email }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) return 'User not found';
    return JSON.stringify({ name: user.name, role: user.role });
  },
});`}</CodeBlock>
        </section>

        {/* Tool events */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Tool Events
          </h2>
          <p className="text-muted-foreground">
            Use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">onToolCall</code> and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">onToolResult</code> callbacks
            to observe tool execution. These are useful for logging, analytics, or updating UI state
            while a tool is running.
          </p>

          <CodeBlock>{`<WebMCPChat
  tools={[calculator, weatherTool]}
  onToolCall={(toolName, args) => {
    console.log(\`Tool called: \${toolName}\`, args);
  }}
  onToolResult={(toolName, result) => {
    console.log(\`Tool result: \${toolName}\`, result);
  }}
/>`}</CodeBlock>
        </section>

        {/* Tools Panel */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Tools Panel
          </h2>
          <p className="text-muted-foreground">
            The built-in tools panel lets users inspect registered tools and their schemas. Control
            its visibility with the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">showToolsPanel</code> and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">showToolsButton</code> props.
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
                  <TableCell className="font-mono text-xs">showToolsPanel</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">false</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Show the tools panel alongside the chat
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">showToolsButton</TableCell>
                  <TableCell className="text-muted-foreground text-xs">boolean</TableCell>
                  <TableCell className="text-muted-foreground text-xs">true</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Show a toggle button to open/close the tools panel
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat
  tools={[calculator]}
  showToolsPanel={true}
  showToolsButton={true}
/>`}</CodeBlock>
        </section>

        {/* Headless mode */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Headless Mode
          </h2>
          <p className="text-muted-foreground">
            In{" "}
            <Link href="/docs/sdk/guides/headless-mode" className="underline hover:text-foreground">
              headless mode
            </Link>
            , use the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">useTools()</code> hook to
            access the registered tools array and execute tools programmatically.
          </p>

          <CodeBlock>{`import { useTools } from 'webmcp-react';

function MyComponent() {
  const { tools, executeTool } = useTools();

  const handleRun = async () => {
    const result = await executeTool('calculator', {
      operation: 'add',
      a: 2,
      b: 3,
    });
    console.log(result); // "5"
  };

  return (
    <div>
      <p>Available tools: {tools.map(t => t.name).join(', ')}</p>
      <button onClick={handleRun}>Run Calculator</button>
    </div>
  );
}`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
