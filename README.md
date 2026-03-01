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
  <strong>Discover and connect MCP services for any task</strong><br>
  <sub>The open registry for MCP and WebMCP service endpoints</sub>
</p>

<p align="center">
  <a href="https://webmcp.land"><img src="https://img.shields.io/badge/Website-webmcp.land-blue?style=flat-square" alt="Website"></a>
  <a href="https://github.com/sindresorhus/awesome"><img src="https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg" alt="Awesome"></a>
  <a href="https://deepwiki.com/eser/webmcp.land"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

<p align="center">
  <a href="https://webmcp.land/registry">Browse Registry</a> &middot;
  <a href="https://webmcp.land/registry/new">Register a Service</a> &middot;
  <a href="#-self-hosting">Self-Host</a>
</p>

---

## What is this?

**webmcp.land** is a discovery platform for [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) and WebMCP services. Organizations register their MCP/WebMCP endpoints, and the platform automatically discovers their tools, methods, and capabilities — making them searchable by use case.

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

## Sponsors

<p align="center">
  <!-- Clemta -->
  <a href="https://clemta.com/?utm_source=webmcp.land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/clemta-dark.webp">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/clemta.webp">
      <img height="35" alt="Clemta" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/clemta.webp">
    </picture>
  </a>&nbsp;&nbsp;
  <!-- Wiro -->
  <a href="https://wiro.ai/?utm_source=webmcp.land">
    <img height="30" alt="Wiro" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/wiro.png">
  </a>&nbsp;&nbsp;
  <!-- Cognition -->
  <a href="https://wind.surf/webmcp-land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/cognition-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/cognition.svg">
      <img height="35" alt="Cognition" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/cognition.svg">
    </picture>
  </a>&nbsp;&nbsp;
  <!-- Sentry -->
  <a href="https://sentry.io/?utm_source=webmcp.land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/sentry-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/sentry.svg">
      <img height="30" alt="Sentry" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/sentry.svg">
    </picture>
  </a>&nbsp;&nbsp;
  <!-- MitteAI -->
  <a href="https://mitte.ai/?utm_source=webmcp.land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/mitte-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/mitte.svg">
      <img height="35" alt="MitteAI" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/mitte.svg">
    </picture>
  </a>&nbsp;&nbsp;
  <!-- Each Labs -->
  <a href="https://www.eachlabs.ai/?utm_source=webmcp.land&utm_medium=referral">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/eachlabs-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/eachlabs.png">
      <img height="28" alt="Each Labs" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/eachlabs.png">
    </picture>
  </a>&nbsp;&nbsp;
  <!-- Warp -->
  <a href="https://warp.dev/?utm_source=webmcp.land">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/warp-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/warp.svg">
      <img height="25" alt="Warp" src="https://raw.githubusercontent.com/eser/webmcp.land/main/public/sponsors/warp.svg">
    </picture>
  </a>
</p>

<p align="center">
  <sub>Built with <a href="https://wind.surf/webmcp-land">Windsurf</a> and <a href="https://devin.ai">Devin</a></sub><br>
  <a href="https://github.com/sponsors/eser/sponsorships?sponsor=eser&tier_id=558224&preview=false"><strong>Become a Sponsor</strong></a>
</p>

---

## Contributors

<a href="https://github.com/eser/webmcp.land/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=eser/webmcp.land" />
</a>

---

## License

**[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)** — Copy, modify, distribute, and use freely. See [LICENSE](LICENSE) for details.
