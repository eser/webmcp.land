# Self-Hosting Guide

## Capabilities

- **MCP Service Registry** — Register and discover MCP/WebMCP service endpoints with automatic capability discovery
- **Discover & Browse** — Explore resources by categories, tags, or AI-powered semantic search
- **Register & Share** — Submit your own MCP/WebMCP endpoints and share them with the community
- **Version Control** — Track resource changes with built-in versioning and change request system (similar to PRs)
- **Personalized Feed** — Subscribe to categories and get a curated feed of resources matching your interests
- **Private Resources** — Keep your resources private or share them with the community
- **Voting & Leaderboard** — Upvote resources and discover the most popular ones via the Top Providers leaderboard
- **Multi-language Support** — Available in English, Spanish, Japanese, Turkish, and Chinese

## Benefits

- **Discover MCP Services:** Find the right MCP tools for any task — search by use case across a growing registry of services
- **Save Time:** Connect to services instantly, browse their tools and capabilities, and integrate them into your AI workflows
- **Community-Driven Quality:** Every resource is curated and refined by the community through change requests and voting
- **Self-Hostable:** Deploy your own white-labeled MCP registry for your team or organization with customizable branding, themes, and authentication
- **Apache-2.0 Licensed:** Fully open source — use freely for any purpose, commercial or personal

## Getting Started

**Requirements:**
- **Plan:** Free and open-source (Apache-2.0 license)
- **User Permissions:** No account needed to browse; sign in via GitHub/Google to register resources
- **Availability:** Generally Available at [webmcp.land](https://webmcp.land)

---

This guide explains how to deploy **webmcp.land** on your own private server for enhanced privacy and customization.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** database
- **pnpm** (recommended) or **npm**

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/webmcp"

# Authentication (choose one provider)
# GitHub OAuth
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# Or Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# NextAuth
AUTH_SECRET="generate-a-random-secret"

# Optional: AI-powered semantic search
OPENAI_API_KEY="your-openai-api-key"
```

## Installation

### Quick Start (Recommended)

The fastest way to create a new webmcp.land instance:

```bash
npx webmcp.land new my-registry
cd my-registry
```

This will:
1. Clone a clean copy of the repository (without development files)
2. Install dependencies
3. Launch the interactive setup wizard

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eser/webmcp.land.git
   cd webmcp.land
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the interactive setup wizard**
   ```bash
   pnpm run setup
   ```
   This will guide you through configuring:
   - **Branding** — App name, logo, description
   - **Theme** — Primary color, border radius, UI variant
   - **Authentication** — GitHub, Google, Apple, Azure AD, or email/password
   - **Languages** — Select from 16 supported locales
   - **Features** — Private resources, categories, tags, comments, AI search, discovery, MCP support

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and auth credentials
   ```

5. **Run database migrations**
   ```bash
   pnpm run db:migrate
   ```

6. **Seed initial data** (optional)
   ```bash
   pnpm run db:seed
   ```

7. **Start the development server**
   ```bash
   pnpm run dev
   ```

8. **Build for production**
   ```bash
   pnpm run build
   pnpm run start
   ```

## Configuration

The setup wizard (`pnpm run setup`) generates `webmcp.config.ts` automatically. You can also manually edit it:

```typescript
// Set to true to use your own branding instead of webmcp.land branding
const useCloneBranding = true;

export default defineConfig({
  // Branding
  branding: {
    name: "Your MCP Registry",
    logo: "/your-logo.svg",
    logoDark: "/your-logo-dark.svg",
    description: "Your custom description",
  },

  // Theme
  theme: {
    radius: "sm",        // "none" | "sm" | "md" | "lg"
    variant: "default",  // "flat" | "default" | "brutal"
    colors: {
      primary: "#6366f1",
    },
  },

  // Authentication
  auth: {
    provider: "github",  // "credentials" | "github" | "google" | "azure"
    allowRegistration: true,
  },

  // Features
  features: {
    privateResources: true,
    changeRequests: true,
    categories: true,
    tags: true,
    aiSearch: false,   // Requires OPENAI_API_KEY
    discovery: true,   // MCP endpoint discovery
  },

  // Homepage
  homepage: {
    useCloneBranding,  // Use your branding on homepage
    achievements: {
      enabled: !useCloneBranding,  // Hide webmcp.land achievements
    },
    sponsors: {
      enabled: !useCloneBranding,  // Hide webmcp.land sponsors
    },
  },

  // Internationalization
  i18n: {
    locales: ["en", "es", "ja", "tr", "zh"],
    defaultLocale: "en",
  },
});
```

### Clone Branding Mode

When `useCloneBranding` is set to `true`, the homepage will:

- Display your **branding name** as the hero title
- Show your **branding description** below the title
- Use your **logo** as a watermark background instead of the video
- Hide the "Deploy Your Private Server" button
- Hide the achievements section (Forbes, GitHub stars, etc.)
- Hide the sponsor links and "Become a Sponsor" CTA

This is ideal for organizations that want to deploy their own white-labeled MCP service registry without webmcp.land branding.

## Support

For issues and questions, please open a [GitHub Issue](https://github.com/eser/webmcp.land/issues).
