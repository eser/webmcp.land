# CLAUDE.md

> Quick reference for Claude Code when working on webmcp.land

## Project Overview

**webmcp.land** is an MCP/WebMCP service registry and discovery platform built with vinext (Vite-based App Router), rolldown-vite, React 19, TypeScript, and PostgreSQL/Drizzle ORM. Users register their MCP/WebMCP endpoints; the platform discovers, indexes, and exposes their tools/methods so others can search by use case.

For detailed agent guidelines, see [AGENTS.md](AGENTS.md).

## Quick Commands

```bash
# Development
pnpm run dev              # Start vinext dev server at localhost:3000
pnpm run build            # Production build (vite build)
pnpm run start            # Production server (node server.js)
pnpm run lint             # Run oxlint

# Database
pnpm run db:generate      # Generate Drizzle migration files
pnpm run db:migrate       # Run Drizzle migrations
pnpm run db:push          # Push schema changes directly
pnpm run db:studio        # Open Drizzle Studio
pnpm run db:seed          # Seed database

# Type checking
pnpm exec tsc --noEmit         # Check TypeScript types
```

## Key Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite/vinext configuration (plugins, aliases, build) |
| `server.js` | Production server entry point (vinext prod server) |
| `webmcp.config.ts` | Main app configuration (branding, theme, auth, features) |
| `src/lib/schema.ts` | Drizzle ORM database schema (tables, enums, relations) |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `src/lib/auth/index.ts` | Auth configuration |
| `src/lib/db.ts` | Drizzle database client singleton |
| `messages/*.json` | i18n translation files |

## Project Structure

```
src/
├── app/              # App Router pages (vinext)
│   ├── (auth)/       # Login, register
│   ├── api/          # API routes
│   ├── registry/     # Resource CRUD pages
│   └── admin/        # Admin dashboard
├── components/       # React components
│   ├── ui/           # shadcn/ui base components
│   └── resources/    # Resource-related components
└── lib/              # Utilities and config
    ├── ai/           # OpenAI integration (embeddings, discovery)
    ├── auth/         # Auth setup
    └── plugins/      # Auth and storage plugins
```

## Core Concepts

- **Resource** — A registered MCP or WebMCP service endpoint
- **Discovery** — Automatic fetching of an endpoint's capabilities and tools
- **Use Cases** — Searchable descriptions of what a resource can do

## Code Patterns

- **Server Components** by default, `"use client"` only when needed
- **Translations:** Use `useTranslations()` or `getTranslations()` from next-intl
- **Styling:** Tailwind CSS with `cn()` utility for conditional classes
- **Forms:** React Hook Form + Zod validation
- **Database:** Drizzle ORM — `db` from `@/lib/db`, schema from `@/lib/schema`

## Before Committing

1. Run `pnpm run lint` to check for issues
2. Add translations for any user-facing text
3. Use existing UI components from `src/components/ui/`
4. Never commit secrets (use `.env`)
