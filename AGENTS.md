# AGENTS.md

> Guidelines for AI coding agents working on this project.

## Project Overview

**webmcp.land** is an MCP/WebMCP service registry and discovery platform. Users register their MCP/WebMCP endpoints, and the platform discovers, indexes, and exposes their tools/methods so others can search by use case. The project is open source and can be self-hosted with customizable branding, themes, and authentication.

### Tech Stack

- **Framework:** vinext (Vite-based App Router) with rolldown-vite and React 19.2
- **Language:** TypeScript 5
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js 5 (beta) with pluggable providers (credentials, GitHub, Google, Azure)
- **Styling:** Tailwind CSS 4 with Radix UI primitives
- **UI Components:** shadcn/ui pattern (components in `src/components/ui/`)
- **Internationalization:** next-intl with 17 supported locales
- **Icons:** Lucide React
- **Forms:** React Hook Form with Zod validation

## Project Structure

```
/
├── drizzle/                # Database migrations and seed
│   └── seed.ts             # Database seeding script
├── public/                 # Static assets (logos, favicon)
├── messages/               # i18n translation files (en.json, es.json, etc.)
├── src/
│   ├── app/                # App Router pages (vinext)
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── [username]/     # User profile pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/            # API routes
│   │   ├── categories/     # Category pages
│   │   ├── registry/       # Resource CRUD pages
│   │   ├── feed/           # User feed
│   │   ├── discover/       # Discovery page
│   │   ├── settings/       # User settings
│   │   └── tags/           # Tag pages
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── auth/           # Authentication components
│   │   ├── categories/     # Category components
│   │   ├── layout/         # Layout components (header, etc.)
│   │   ├── resources/      # Resource-related components
│   │   ├── providers/      # React context providers
│   │   ├── settings/       # Settings components
│   │   └── ui/             # shadcn/ui base components
│   ├── lib/                # Utility libraries
│   │   ├── ai/             # AI/OpenAI integration (embeddings, discovery)
│   │   ├── auth/           # NextAuth configuration
│   │   ├── config/         # Config type definitions
│   │   ├── i18n/           # Internationalization setup
│   │   ├── plugins/        # Plugin system (auth, storage)
│   │   ├── schema.ts       # Drizzle ORM schema (tables, enums, relations)
│   │   ├── db.ts           # Drizzle database client instance
│   │   └── utils.ts        # Utility functions (cn)
│   └── i18n/               # i18n request handler
├── webmcp.config.ts        # Main application configuration
└── package.json            # Dependencies and scripts
```

## Commands

```bash
# Development
pnpm run dev              # Start vinext dev server (localhost:3000)
pnpm run build            # Build for production (vite build)
pnpm run start            # Start production server (node server.js)
pnpm run lint             # Run oxlint

# Database
pnpm run db:generate      # Generate Drizzle migration files from schema
pnpm run db:migrate       # Run Drizzle migrations
pnpm run db:push          # Push schema changes directly to database
pnpm run db:studio        # Open Drizzle Studio
pnpm run db:seed          # Seed database with initial data

# Type checking
pnpm exec tsc --noEmit         # Check TypeScript types without emitting

# Translations
node scripts/check-translations.cjs  # Check for missing translations across locales
```

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use `interface` for object shapes, `type` for unions/intersections
- Functions: `camelCase` (e.g., `getUserData`, `handleSubmit`)
- Components: `PascalCase` (e.g., `ResourceCard`, `AuthContent`)
- Constants: `UPPER_SNAKE_CASE` for true constants
- Files: `kebab-case.tsx` for components, `camelCase.ts` for utilities

### React/vinext

- Use React Server Components by default
- Add `"use client"` directive only when client interactivity is needed
- Prefer server actions over API routes for mutations
- Use `next-intl` for all user-facing strings (never hardcode text)
- Import translations with `useTranslations()` or `getTranslations()`

### Component Pattern

```tsx
// Client component example
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const t = useTranslations("namespace");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction}>{t("actionLabel")}</Button>
    </div>
  );
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design (`sm:`, `md:`, `lg:` breakpoints)
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Prefer Radix UI primitives via shadcn/ui components
- Keep component styling scoped and composable

### Database

- Use Drizzle ORM — import `db` from `@/lib/db`, tables from `@/lib/schema`
- Use `db.select().from(table).where(...)` for queries, `db.query.table.findMany({ with: {...} })` for relational queries
- Use `db.insert(table).values(data).returning()` for inserts
- Use `db.update(table).set(data).where(...).returning()` for updates
- Use `db.transaction(async (tx) => { ... })` for multi-step operations
- Import operators from `drizzle-orm`: `eq`, `and`, `or`, `desc`, `asc`, `count`, `sql`, `ilike`, `inArray`, etc.

## Configuration

The main configuration file is `webmcp.config.ts`:

- **branding:** Logo, name, and description
- **theme:** Colors, border radius, UI variant
- **auth:** Authentication providers array (credentials, github, google, azure)
- **i18n:** Supported locales and default locale
- **features:** Feature flags (privateResources, changeRequests, categories, tags, aiSearch, discovery)
- **homepage:** Homepage customization and sponsors

## Plugin System

Authentication and storage use a plugin architecture:

### Auth Plugins (`src/lib/plugins/auth/`)
- `credentials.ts` - Email/password authentication
- `github.ts` - GitHub OAuth
- `google.ts` - Google OAuth
- `azure.ts` - Microsoft Entra ID

### Storage Plugins (`src/lib/plugins/storage/`)
- `url.ts` - URL-based media (default)
- `s3.ts` - AWS S3 storage

## Internationalization

- Translation files are in `messages/{locale}.json`
- Currently supported: en, tr, es, zh, ja, ar, pt, fr, de, ko, it, nl, ru, he, el, az, fa
- Add new locales to `webmcp.config.ts` i18n.locales array
- Create corresponding translation file in `messages/`
- Add language to selector in `src/components/layout/header.tsx`

## Key Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite/vinext configuration (plugins, aliases, build) |
| `server.js` | Production server entry point (vinext prod server) |
| `webmcp.config.ts` | Main app configuration |
| `src/lib/schema.ts` | Drizzle ORM schema (tables, enums, relations) |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `src/lib/auth/index.ts` | NextAuth configuration |
| `src/lib/db.ts` | Drizzle database client singleton |
| `src/app/layout.tsx` | Root layout with providers |
| `src/components/ui/` | Base UI components (shadcn) |

## Boundaries

### Always Do
- Run `pnpm run lint` before committing
- Use existing UI components from `src/components/ui/`
- Add translations for all user-facing text
- Follow existing code patterns and file structure
- Use TypeScript strict types

### Ask First
- Database schema changes (require migrations)
- Adding new dependencies
- Modifying authentication flow
- Changes to `webmcp.config.ts` structure

### Never Do
- Commit secrets or API keys (use `.env`)
- Modify `node_modules/` or generated files
- Delete existing translations
- Remove or weaken TypeScript types
- Hardcode user-facing strings (use i18n)

## Environment Variables

Required in `.env`:
```
DATABASE_URL=           # PostgreSQL connection string
AUTH_SECRET=            # NextAuth secret key
```

Optional OAuth (if using those providers):
```
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_AZURE_AD_CLIENT_ID=
AUTH_AZURE_AD_CLIENT_SECRET=
AUTH_AZURE_AD_ISSUER=
```

Optional features:
```
OPENAI_API_KEY=         # For AI-powered semantic search
```

## Testing

Tests use Vitest with jsdom environment and React Testing Library:
```bash
pnpm run test              # Run all tests
pnpm run test:watch        # Run in watch mode
pnpm run test:coverage     # Run with coverage report
```
- Place tests adjacent to source files as `*.test.ts` or `*.test.tsx`
- Use descriptive test names
- Mock external services (database, OAuth)

## Core Concepts

- **Resource** — A registered MCP or WebMCP service endpoint
- **Discovery** — Automatic fetching of an endpoint's capabilities and tools
- **Use Cases** — Searchable descriptions of what a resource can do

## Common Tasks

### Adding a new page
1. Create route in `src/app/{route}/page.tsx`
2. Use server component for data fetching
3. Add translations to `messages/*.json`

### Adding a new component
1. Create in appropriate `src/components/{category}/` folder
2. Export from component file (no barrel exports needed)
3. Follow existing component patterns

### Adding a new API route
1. Create in `src/app/api/{route}/route.ts`
2. Export appropriate HTTP method handlers (GET, POST, etc.)
3. Use Zod for request validation
4. Return proper JSON responses with status codes

### Modifying database schema
1. Update `src/lib/schema.ts` (add/modify tables, columns, relations)
2. Run `pnpm run db:generate` to create a migration file
3. Run `pnpm run db:migrate` to apply the migration
4. Types are automatically inferred from the schema (use `typeof table.$inferSelect`)
