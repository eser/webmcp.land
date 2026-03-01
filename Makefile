# webmcp.land — Development Makefile
# Services (PostgreSQL) run in Docker, app runs on host.
#
# Quick start:
#   make setup   — first-time bootstrap (install deps, start DB, migrate, seed)
#   make dev     — start DB + dev server
#   make test    — run tests
#   make clean   — tear down containers and volumes

.PHONY: dev db db-stop db-migrate db-seed db-studio db-setup \
        test typecheck lint build setup clean install

# ── Development ──────────────────────────────────────────────

dev: db-wait ## Start DB + dev server
	pnpm run dev

build: ## Production build
	pnpm run build

install: ## Install dependencies
	pnpm install

# ── Database ─────────────────────────────────────────────────

db: ## Start PostgreSQL in Docker
	docker compose up db -d

db-stop: ## Stop PostgreSQL
	docker compose stop db

db-wait: db ## Start DB and wait until healthy
	@echo "Waiting for PostgreSQL..."
	@until docker compose exec db pg_isready -U postgres -d webmcp_land -q 2>/dev/null; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."

db-migrate: ## Run Drizzle migrations
	pnpm run db:migrate

db-seed: ## Seed the database
	pnpm run db:seed

db-studio: ## Open Drizzle Studio
	pnpm run db:studio

db-setup: db-wait db-migrate db-seed ## Migrate + seed (first-time)

# ── Quality ──────────────────────────────────────────────────

test: ## Run tests
	pnpm run test

typecheck: ## TypeScript type check
	pnpm exec tsc --noEmit

lint: ## Run oxlint
	pnpm run lint

# ── Lifecycle ────────────────────────────────────────────────

setup: install db-setup ## Full bootstrap: install → DB → migrate → seed

clean: ## Stop containers and remove volumes
	docker compose down -v

# ── Help ─────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
