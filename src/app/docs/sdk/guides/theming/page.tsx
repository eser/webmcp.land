import Link from "next/link";
import { Palette, Sun, Moon, Paintbrush, Code } from "lucide-react";
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
  title: "Theming - WebMCP SDK Guide",
  description:
    "Customize the look and feel of WebMCP with built-in themes, quick props, createTheme(), and CSS variables",
};

export default async function ThemingPage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">Theming</h1>
      <p className="text-muted-foreground mb-8">
        WebMCP ships with a flexible theming system. Choose a built-in theme,
        apply quick customizations, or build a fully custom theme with{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createTheme()</code>.
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {/* Built-in themes */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Built-in Themes
          </h2>
          <p className="text-muted-foreground">
            WebMCP includes two built-in themes. Pass the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">theme</code> prop to switch
            between them.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Value</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">&quot;dark&quot;</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Dark color scheme (default)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">&quot;light&quot;</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Light color scheme
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat theme="light" />`}</CodeBlock>
        </section>

        {/* Quick customization */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Quick Customization
          </h2>
          <p className="text-muted-foreground">
            Override individual design tokens without creating a full theme object.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Prop</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">accentColor</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Primary accent color (hex, rgb, hsl)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">borderRadius</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Base border radius (e.g. &quot;8px&quot;, &quot;0.5rem&quot;)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">fontFamily</TableCell>
                  <TableCell className="text-muted-foreground text-xs">string</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Font family for the entire chat UI</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <CodeBlock>{`<WebMCPChat
  accentColor="#6366f1"
  borderRadius="12px"
  fontFamily="'Inter', sans-serif"
/>`}</CodeBlock>
        </section>

        {/* createTheme */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            createTheme()
          </h2>
          <p className="text-muted-foreground">
            For full control, use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createTheme()</code> to build
            a custom theme object with colors, fonts, radii, and shadows.
          </p>

          <CodeBlock>{`import { createTheme } from 'webmcp-react';

const myTheme = createTheme({
  colors: {
    bg0: '#0a0a0a',
    bg1: '#141414',
    bg2: '#1e1e1e',
    bg3: '#282828',
    accent: '#6366f1',
    accentSoft: '#6366f122',
    text0: '#fafafa',
    text1: '#a1a1aa',
    text2: '#71717a',
    border: '#27272a',
    red: '#ef4444',
    green: '#22c55e',
  },
  fonts: {
    sans: "'Inter', sans-serif",
    mono: "'Fira Code', monospace",
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    chatbox: '0 4px 24px rgba(0,0,0,0.3)',
    button: '0 1px 3px rgba(0,0,0,0.2)',
  },
});

<WebMCPChat theme={myTheme} />`}</CodeBlock>
        </section>

        {/* Theme tokens */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Tokens Reference
          </h2>

          <h3 className="font-medium">Colors</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Token</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">bg0</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Base background (deepest layer)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">bg1</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Card / panel background</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">bg2</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Input / elevated surface background</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">bg3</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Hover / active state background</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">accent</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Primary accent (buttons, links, focus rings)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">accentSoft</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Translucent accent for backgrounds and badges</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">text0</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Primary text color</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">text1</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Secondary / muted text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">text2</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Tertiary / placeholder text</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">border</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Border color for dividers and outlines</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">red</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Error / destructive actions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">green</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Success / positive indicators</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">Fonts</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Token</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">sans</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Sans-serif font stack for body text and UI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">mono</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Monospace font stack for code blocks</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">Radii</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Token</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">sm</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Small radius (inline badges, chips)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">md</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Medium radius (buttons, inputs)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">lg</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Large radius (cards, panels)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">full</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Fully rounded (pills, avatars)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="font-medium">Shadows</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Token</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">chatbox</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Shadow applied to the chat container</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">button</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Shadow applied to buttons</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* CSS Variables */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            CSS Variables Override
          </h2>
          <p className="text-muted-foreground">
            Every theme token is also exposed as a CSS custom property with the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">--wmcp-</code> prefix. You can
            override them in your own stylesheet without using{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">createTheme()</code>.
          </p>

          <CodeBlock title="globals.css">{`/* Override in your global CSS */
:root {
  --wmcp-accent: #6366f1;
  --wmcp-bg0: #0f0f0f;
  --wmcp-border: #333;
  --wmcp-font-sans: 'Inter', sans-serif;
  --wmcp-radius-md: 8px;
  --wmcp-shadow-chatbox: 0 4px 24px rgba(0,0,0,0.3);
}`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
