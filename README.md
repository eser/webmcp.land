<h1 align="center">
  <a href="https://webmcp.land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://webmcp.land/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://webmcp.land/logo.svg">
      <img height="60" alt="webmcp.land" src="https://webmcp.land/logo.svg">
    </picture>
    <br>
    webmcp.land
  </a>
</h1>

<p align="center">
  <strong>The AI-enabled Service Registry of MCP & WebMCP resources</strong><br>
  <sub>Discover, register, and connect MCP services for any task. Free and open source.</sub>
</p>

<p align="center">
  <a href="https://webmcp.land"><img src="https://img.shields.io/badge/Website-webmcp.land-blue?style=flat-square" alt="Website"></a>
  <a href="https://deepwiki.com/eser/webmcp.land"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

<p align="center">
  <a href="https://webmcp.land/registry">Browse Registry</a> &middot;
  <a href="https://webmcp.land/registry/new">Register a Service</a> &middot;
  <a href="#-self-hosting">Self-Host</a>
</p>

---

## What is this?

**webmcp.land** is a discovery platform for [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) and WebMCP services. Organizations and developers register their MCP/WebMCP endpoints, and the platform discovers their tools, methods, and capabilities — making them searchable by use case.

It is forked from [@f](https://github.com/f)'s [prompts.chat](https://github.com/f/awesome-chatgpt-prompts) and pivoted for MCP resources, building on top of that foundation.

**Example:** An airline registers their WebMCP endpoint. When a user searches for "reserving a flight ticket", webmcp.land surfaces the airline's booking tools and capabilities.

### How it works

1. **Register** your MCP or WebMCP service endpoint
2. **Discover** — the platform fetches your server's capabilities and tools
3. **Search** — users find your service by describing what they want to do
4. **Connect** — users integrate your service into their AI workflows

---

## Self-Hosting

Deploy your own private MCP service registry with custom branding, themes, and authentication.

**Quick Start:**
```bash
npx webmcp.land new my-registry
cd my-registry
```

**Manual Setup:**
```bash
git clone https://github.com/eser/webmcp.land.git
cd webmcp.land
pnpm install && pnpm run setup
```

After setup, push the database schema and seed with demo data:

```bash
pnpm run db:push        # Create tables
pnpm run db:seed         # Seed with demo data (50 sample resources)
pnpm run dev             # Start dev server at localhost:3000
```

**Default admin credentials:** `admin@webmcp.land` / `password123`

The setup wizard configures branding, theme, authentication (GitHub/Google/Azure AD), and features.

**[Full Self-Hosting Guide](SELF-HOSTING.md)** | **[Docker Guide](DOCKER.md)**

---

## Integrations

### CLI
```bash
npx webmcp.land
```

### Claude Code Plugin
```
/plugin marketplace add eser/webmcp.land
/plugin install webmcp.land@webmcp.land
```
[Plugin Documentation](CLAUDE-PLUGIN.md)

### MCP Server
Use webmcp.land as an MCP server in your AI tools.

**Remote (recommended):**
```json
{
  "mcpServers": {
    "webmcp.land": {
      "url": "https://webmcp.land/api/mcp"
    }
  }
}
```

**Local:**
```json
{
  "mcpServers": {
    "webmcp.land": {
      "command": "npx",
      "args": ["-y", "webmcp.land", "mcp"]
    }
  }
}
```

[MCP Documentation](https://webmcp.land/docs/api)

---

## Tech Stack

- **Framework:** [vinext](https://github.com/nicepkg/vinext) (Vite-based App Router) + React 19
- **Database:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Auth:** [Better Auth](https://www.better-auth.com/)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Language:** TypeScript
- **i18n:** 17 languages via i18next

---

## Contributors

<a href="https://github.com/eser/webmcp.land/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=eser/webmcp.land" />
</a>

---

## License

**[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)** — Free to use, modify, and share with proper attribution. See [LICENSE](LICENSE) for details.
