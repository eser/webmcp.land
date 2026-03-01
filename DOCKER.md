# Docker Deployment Guide

Run your own webmcp.land instance with a single command.

## Quick Start

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  ghcr.io/eser/webmcp.land
```

**First run:** The container will clone the repository and build the app (~3-5 minutes).
**Subsequent runs:** Starts immediately using the cached build.

Open http://localhost:4444 in your browser.

## Custom Branding

Customize your instance with environment variables:

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -e WMCP_NAME="Acme MCP Registry" \
  -e WMCP_DESCRIPTION="Our team's MCP service registry" \
  -e WMCP_COLOR="#ff6600" \
  -e WMCP_AUTH_PROVIDERS="github,google" \
  -e WMCP_LOCALES="en,es,fr" \
  ghcr.io/eser/webmcp.land
```

> **Note:** Branding is applied during the first build. To change branding later, delete the volume and re-run:
> ```bash
> docker rm -f webmcp
> docker volume rm webmcp-data
> docker run ... # with new env vars
> ```

## Configuration Variables

All variables are prefixed with `WMCP_` to avoid conflicts.

#### Branding (`branding.*` in webmcp.config.ts)

| Env Variable | Config Path | Description | Default |
|--------------|-------------|-------------|---------|
| `WMCP_NAME` | `branding.name` | App name shown in UI | `My MCP Registry` |
| `WMCP_DESCRIPTION` | `branding.description` | App description | `Discover and connect...` |
| `WMCP_LOGO` | `branding.logo` | Logo path (in public/) | `/logo.svg` |
| `WMCP_LOGO_DARK` | `branding.logoDark` | Dark mode logo | Same as `WMCP_LOGO` |
| `WMCP_FAVICON` | `branding.favicon` | Favicon path | `/logo.svg` |

#### Theme (`theme.*` in webmcp.config.ts)

| Env Variable | Config Path | Description | Default |
|--------------|-------------|-------------|---------|
| `WMCP_COLOR` | `theme.colors.primary` | Primary color (hex) | `#6366f1` |
| `WMCP_THEME_RADIUS` | `theme.radius` | Border radius: `none\|sm\|md\|lg` | `sm` |
| `WMCP_THEME_VARIANT` | `theme.variant` | UI style: `default\|flat\|brutal` | `default` |
| `WMCP_THEME_DENSITY` | `theme.density` | Spacing: `compact\|default\|comfortable` | `default` |

#### Authentication (`auth.*` in webmcp.config.ts)

| Env Variable | Config Path | Description | Default |
|--------------|-------------|-------------|---------|
| `WMCP_AUTH_PROVIDERS` | `auth.providers` | Providers: `github,google,credentials` | `credentials` |
| `WMCP_ALLOW_REGISTRATION` | `auth.allowRegistration` | Allow public signup | `true` |

#### Internationalization (`i18n.*` in webmcp.config.ts)

| Env Variable | Config Path | Description | Default |
|--------------|-------------|-------------|---------|
| `WMCP_LOCALES` | `i18n.locales` | Supported locales (comma-separated) | `en` |
| `WMCP_DEFAULT_LOCALE` | `i18n.defaultLocale` | Default locale | `en` |

#### Features (`features.*` in webmcp.config.ts)

| Env Variable | Config Path | Description | Default |
|--------------|-------------|-------------|---------|
| `WMCP_FEATURE_PRIVATE_RESOURCES` | `features.privateResources` | Enable private resources | `true` |
| `WMCP_FEATURE_CHANGE_REQUESTS` | `features.changeRequests` | Enable versioning | `true` |
| `WMCP_FEATURE_CATEGORIES` | `features.categories` | Enable categories | `true` |
| `WMCP_FEATURE_TAGS` | `features.tags` | Enable tags | `true` |
| `WMCP_FEATURE_COMMENTS` | `features.comments` | Enable comments | `true` |
| `WMCP_FEATURE_AI_SEARCH` | `features.aiSearch` | Enable AI search | `false` |
| `WMCP_FEATURE_AI_GENERATION` | `features.aiGeneration` | Enable AI generation | `false` |
| `WMCP_FEATURE_MCP` | `features.mcp` | Enable MCP features | `false` |

## System Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SECRET` | Secret for authentication tokens | Auto-generated |
| `PORT` | Internal container port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Internal DB |

## Production Setup

For production, set `AUTH_SECRET` explicitly:

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e WMCP_NAME="My MCP Registry" \
  ghcr.io/eser/webmcp.land
```

### With OAuth Providers

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -e AUTH_SECRET="your-secret-key" \
  -e WMCP_AUTH_PROVIDERS="github,google" \
  -e AUTH_GITHUB_ID="your-github-client-id" \
  -e AUTH_GITHUB_SECRET="your-github-client-secret" \
  -e AUTH_GOOGLE_ID="your-google-client-id" \
  -e AUTH_GOOGLE_SECRET="your-google-client-secret" \
  ghcr.io/eser/webmcp.land
```

### With AI Features (OpenAI)

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -e WMCP_FEATURE_AI_SEARCH="true" \
  -e OPENAI_API_KEY="sk-..." \
  ghcr.io/eser/webmcp.land
```

## Custom Logo

Mount your logo file:

```bash
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -v ./my-logo.svg:/data/app/public/logo.svg \
  -e WMCP_NAME="My App" \
  ghcr.io/eser/webmcp.land
```

## Data Persistence

### All-in-One Image

Data is stored in `/data` inside the container:
- `/data/postgres` - PostgreSQL database files

Mount a volume to persist data:

```bash
docker run -d \
  -v webmcp-data:/data \
  ghcr.io/eser/webmcp.land
```

### Backup

```bash
# Backup database
docker exec webmcp pg_dump -U webmcp webmcp > backup.sql

# Restore database
docker exec -i webmcp psql -U webmcp webmcp < backup.sql
```

## Building Locally

Build and run locally:

```bash
docker build -f docker/Dockerfile -t webmcp.land .
docker run -p 4444:3000 -v webmcp-data:/data webmcp.land
```

## Health Check

The container includes a health check endpoint:

```bash
curl http://localhost:4444/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Troubleshooting

### View Logs

```bash
# All logs
docker logs webmcp

# Follow logs
docker logs -f webmcp

# PostgreSQL logs (inside container)
docker exec webmcp cat /var/log/supervisor/postgresql.log

# App logs (inside container)
docker exec webmcp cat /var/log/supervisor/nextjs.log
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it webmcp psql -U webmcp -d webmcp

# Run SQL query
docker exec webmcp psql -U webmcp -d webmcp -c "SELECT COUNT(*) FROM resources"
```

### Container Shell

```bash
docker exec -it webmcp bash
```

### Common Issues

**Container won't start:**
- Check logs: `docker logs webmcp`
- Ensure port 4444 is available: `lsof -i :4444`

**Database connection errors:**
- Wait for PostgreSQL to initialize (can take 30-60 seconds on first run)
- Check database logs: `docker exec webmcp cat /var/log/supervisor/postgresql.log`

**Authentication issues:**
- Ensure `AUTH_SECRET` is set for production
- For OAuth, verify callback URLs are configured correctly

## Resource Requirements

Minimum:
- 1 CPU core
- 1GB RAM
- 2GB disk space

Recommended:
- 2 CPU cores
- 2GB RAM
- 10GB disk space

## Updating

```bash
# Pull latest image
docker pull ghcr.io/eser/webmcp.land

# Stop and remove old container
docker stop webmcp && docker rm webmcp

# Start new container (data persists in volume)
docker run -d \
  --name webmcp \
  -p 4444:3000 \
  -v webmcp-data:/data \
  -e AUTH_SECRET="your-secret-key" \
  ghcr.io/eser/webmcp.land
```

## Security Considerations

1. **Always set AUTH_SECRET** in production
2. **Use HTTPS** - put a reverse proxy (nginx, Caddy, Traefik) in front
3. **Limit exposed ports** - only expose what's needed
4. **Regular updates** - pull the latest image regularly
5. **Backup data** - regularly backup the `/data` volume

## Example: Running Behind Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name registry.example.com;

    ssl_certificate /etc/letsencrypt/live/registry.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/registry.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4444;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## License

Apache License 2.0
