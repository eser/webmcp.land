import Link from "next/link";
import {
  Plug,
  Globe,
  Shield,
  Server,
  Monitor,
  Cpu,
  ArrowRight,
  ExternalLink,
  Layers,
  Wrench,
  Database,
  MessageSquare,
  FileCode,
  Code,
  BookOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "@/i18n/request";

export async function generateMetadata() {
  const t = await getTranslations("whatsWebmcp");
  return {
    title: `${t("title")} - webmcp.land`,
    description: t("subtitle"),
  };
}

export default async function WhatsWebmcpPage() {
  const t = await getTranslations("whatsWebmcp");

  return (
    <div className="container max-w-4xl py-10">
      {/* Hero */}
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-lg text-muted-foreground mb-10">{t("subtitle")}</p>

      <div className="space-y-12">
        {/* Section: What is MCP? */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plug className="h-5 w-5" />
            {t("mcpTitle")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{t("mcpDefinition")}</p>
          <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm italic text-muted-foreground">
            {t("mcpAnalogy")}
          </div>

          {/* Architecture */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t("mcpArchitectureTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{t("mcpArchitectureDesc")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  {t("mcpHost")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpHostDesc")}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <ArrowRight className="h-4 w-4 text-green-500" />
                  {t("mcpClient")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpClientDesc")}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Server className="h-4 w-4 text-purple-500" />
                  {t("mcpServer")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpServerDesc")}</p>
              </div>
            </div>
          </div>

          {/* Primitives */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              {t("mcpPrimitivesTitle")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Wrench className="h-4 w-4" />
                  {t("mcpTools")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpToolsDesc")}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Database className="h-4 w-4" />
                  {t("mcpResources")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpResourcesDesc")}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <MessageSquare className="h-4 w-4" />
                  {t("mcpPrompts")}
                </div>
                <p className="text-xs text-muted-foreground">{t("mcpPromptsDesc")}</p>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="font-semibold mb-3">{t("mcpUseCasesTitle")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>{t("mcpUseCase1")}</li>
              <li>{t("mcpUseCase2")}</li>
              <li>{t("mcpUseCase3")}</li>
              <li>{t("mcpUseCase4")}</li>
            </ul>
          </div>
        </section>

        {/* Section: What is WebMCP? */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("webmcpTitle")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{t("webmcpDefinition")}</p>
          <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
            {t("webmcpKeyPoint")}
          </div>

          {/* Two APIs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Code className="h-4 w-4" />
              {t("webmcpApisTitle")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-orange-500" />
                  {t("webmcpDeclarative")}
                </div>
                <p className="text-xs text-muted-foreground">{t("webmcpDeclarativeDesc")}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-500" />
                  {t("webmcpImperative")}
                </div>
                <p className="text-xs text-muted-foreground">{t("webmcpImperativeDesc")}</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("webmcpSecurityTitle")}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>{t("webmcpSecurityConsent")}</li>
              <li>{t("webmcpSecurityReadOnly")}</li>
              <li>{t("webmcpSecurityPermissions")}</li>
            </ul>
          </div>
        </section>

        {/* Section: Comparison Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t("comparisonTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("comparisonDesc")}</p>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">{t("comparisonFeature")}</TableHead>
                  <TableHead>{t("comparisonMcp")}</TableHead>
                  <TableHead>{t("comparisonWebmcp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{t("comparisonEnvironment")}</TableCell>
                  <TableCell>{t("comparisonMcpEnvironment")}</TableCell>
                  <TableCell>{t("comparisonWebmcpEnvironment")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("comparisonProtocol")}</TableCell>
                  <TableCell>{t("comparisonMcpProtocol")}</TableCell>
                  <TableCell>{t("comparisonWebmcpProtocol")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("comparisonAuth")}</TableCell>
                  <TableCell>{t("comparisonMcpAuth")}</TableCell>
                  <TableCell>{t("comparisonWebmcpAuth")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("comparisonUseCaseLabel")}</TableCell>
                  <TableCell>{t("comparisonMcpUseCase")}</TableCell>
                  <TableCell>{t("comparisonWebmcpUseCase")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("comparisonDevelopedBy")}</TableCell>
                  <TableCell>{t("comparisonMcpDevelopedBy")}</TableCell>
                  <TableCell>{t("comparisonWebmcpDevelopedBy")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Section: Code Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            {t("codeExamplesTitle")}
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">{t("codeExampleMcpTitle")}</h3>
              <pre className="rounded-lg border bg-muted/50 p-4 text-xs overflow-x-auto">
                <code>{`// MCP Server — defining a tool
{
  "name": "search_flights",
  "description": "Search available flights between airports",
  "inputSchema": {
    "type": "object",
    "properties": {
      "origin": { "type": "string", "description": "Origin airport code (IATA)" },
      "destination": { "type": "string", "description": "Destination airport code" },
      "date": { "type": "string", "format": "date" }
    },
    "required": ["origin", "destination", "date"]
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">{t("codeExampleWebmcpTitle")}</h3>
              <pre className="rounded-lg border bg-muted/50 p-4 text-xs overflow-x-auto">
                <code>{`// WebMCP — browser-native tool registration
navigator.modelContext.registerTool({
  name: "searchFlights",
  description: "Search available flights",
  inputSchema: {
    type: "object",
    properties: {
      origin: { type: "string", pattern: "^[A-Z]{3}$" },
      destination: { type: "string", pattern: "^[A-Z]{3}$" },
      date: { type: "string", pattern: "^\\\\d{4}-\\\\d{2}-\\\\d{2}$" }
    },
    required: ["origin", "destination", "date"]
  },
  async execute({ origin, destination, date }) {
    const results = await flightAPI.search({ origin, destination, date });
    return {
      content: [{ type: "text", text: JSON.stringify(results) }]
    };
  }
});`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Section: How webmcp.land Fits In */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("platformTitle")}
          </h2>
          <p className="text-muted-foreground">{t("platformDesc")}</p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <span className="text-muted-foreground pt-0.5">{t("platformStep1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <span className="text-muted-foreground pt-0.5">{t("platformStep2")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <span className="text-muted-foreground pt-0.5">{t("platformStep3")}</span>
            </li>
          </ol>
        </section>

        {/* Section: Resources & Links */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {t("resourcesTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: t("resourceMcpSite"), href: "https://modelcontextprotocol.io" },
              { label: t("resourceMcpSpec"), href: "https://spec.modelcontextprotocol.io" },
              { label: t("resourceWebmcpSpec"), href: "https://webmachinelearning.github.io/webmcp/" },
              { label: t("resourceWebmcpSite"), href: "https://webmcp.link" },
              { label: t("resourceWebmcpGithub"), href: "https://github.com/webmachinelearning/webmcp" },
              { label: t("resourceChromePreview"), href: "https://developer.chrome.com/blog/webmcp-epp" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:border-foreground/20 hover:bg-muted/50 transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="group-hover:text-foreground transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
