# Notes App - AI Coding Agent Instructions

## Project Structure (Monorepo)

This is a **full-stack TypeScript monorepo** with separate backend and frontend:

- **Backend** (`/src`): Express REST API + PostgreSQL
- **Frontend** (`/web`): Next.js 16 App Router + React Query + shadcn/ui
- **Deployment**: Separate containers (backend + database via Docker Compose, frontend via Vercel/standalone)

## Backend Architecture (Express API)

### Request Flow

**Entry**: `server.ts` → `app.ts` (Express setup) → `routes/` → `controllers/` → `database/db.ts`

**Key Pattern**: Controllers use database helper functions (`query`, `queryOne`, `transaction`) from `database/db.ts`, NOT direct pool access

**Error Handling**: Custom `AppError` class with status codes, caught by global `errorHandler` middleware

## Critical Database Patterns

### Transaction Usage (MANDATORY for multi-step operations)

```typescript
// ✅ CORRECT - Use transaction for create/update with tags
await transaction(async (client) => {
  const result = await client.query('INSERT INTO notes...', [...]);
  await client.query('INSERT INTO tags...', [...]);
  return result.rows[0];
});

// ❌ WRONG - Never use queryOne/query inside transactions
await transaction(async (client) => {
  await queryOne('INSERT...'); // Uses different connection!
});
```

### Error Handling Pattern (ALL controllers must follow)

```typescript
} catch (error) {
  if (error instanceof AppError) {
    throw error; // Preserve 404, 400, etc.
  }
  throw AppError.internal("Failed to..."); // Only 500 for unexpected
}
```

## Database Schema (Many-to-Many with Tags)

- **notes** ↔ **note_tags** ↔ **tags** (junction table)
- Tags are auto-created on note create/update if they don't exist (default color: "#808080")
- Always use `COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) as tags` to aggregate tags
- Cascade deletes: Deleting a note automatically removes `note_tags` associations

## Configuration & Environment

- **Config Pattern**: Uses Zod validation in `config/config.ts` - ALL env vars are validated on startup
- **Required Env Vars**: `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- **Optional Env Vars**: `PORT` (6767), `NODE_ENV` (development), `ALLOWED_ORIGINS` (comma-separated)
- **CORS**: Origins validated against `allowedOrigins` array from config - requests with no origin allowed (Postman)

## Logging (Winston + Morgan)

- **Development**: Colorized console logs
- **Production**: Structured JSON logs → `logs/combined.log` and `logs/error.log`
- **Usage**: `import logger from './config/logger'` → `logger.info('message', { metadata })`
- **HTTP Logs**: Morgan streams to Winston via `morganStream`

## Development Workflow

```bash
# Backend setup and development (from root)
npm run db:up              # Start PostgreSQL container
npm run dev                # Start API server (localhost:6767)
npm run db:shell           # Access PostgreSQL REPL
npm run db:reset           # Reset database (deletes data/)

# Frontend development (from /web)
cd web && npm run dev      # Start Next.js dev server (localhost:3000)

# Database init runs automatically via docker-entrypoint-initdb.d/init.sql
```

## Frontend Architecture (Next.js)

### Tech Stack & Patterns

- **Framework**: Next.js 16 (App Router) with React 19 and React Server Components
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style, neutral base color)
- **Data Fetching**: TanStack React Query (for server state management)
- **Component Library**: shadcn/ui components (stored in `@/components/ui`)
- **Icons**: Lucide React
- **Utils**: `cn()` utility (`lib/utils.ts`) for conditional Tailwind classes

### File Structure Conventions

```
web/
├── app/                    # App Router pages and layouts
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   ├── page.tsx           # Home page (notes list/grid)
│   └── globals.css        # Tailwind directives + CSS variables
├── components/            # React components (to be added)
│   └── ui/               # shadcn/ui components (auto-generated)
├── lib/
│   └── utils.ts          # Utility functions (cn() for className merging)
└── hooks/                # Custom React hooks (to be added)
```

### Key Configuration Files

- `components.json` - shadcn/ui config (RSC enabled, path aliases, New York style)
- `next.config.ts` - Next.js configuration
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/ui` (from components.json)

### Frontend Development Guidelines

1. **Use Server Components by default** - Only add `'use client'` when needed (interactivity, hooks, context)
2. **Data fetching**: Use React Query for API calls to backend (`http://localhost:6767/api`)
3. **Styling**: Use Tailwind + `cn()` utility for conditional classes
4. **Components**: Install shadcn/ui components as needed (`npx shadcn@latest add <component>`)
5. **API integration**: Backend runs on port 6767, frontend on 3000 (CORS configured for localhost:3000)

## API Endpoints Reference

All endpoints prefixed with `/api` (e.g., `GET /api/notes`):

- `GET /api/notes` - List notes (query: `?archived=true`, `?tag=work`, `?search=keyword`)
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note (body: `{ title, description?, color?, tags?: string[] }`)
- `PATCH /api/notes/:id` - Update note
- `PATCH /api/notes/:id/archive` - Toggle archive status
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/bulk-delete` - Delete multiple (body: `{ ids: number[] }`)
- `GET /api/tags` - List all tags with usage count

## Controller Conventions

1. **Always validate input** before database operations (use `AppError.badRequest()`)
2. **Check resource exists** before update/delete operations (throw `AppError.notFound()`)
3. **Use transactions** for any operation that touches multiple tables (create/update notes with tags)
4. **Return consistent response shape**: `{ success: true, message?, data, count? }`
5. **Status codes**: 200 (success), 201 (created), 404 (not found), 400 (bad request), 500 (server error)

## Key Files Reference

- `database/db.ts` - Query helpers and transaction wrapper (use ONLY these, not pool directly)
- `models/AppError.ts` - Custom error class with factory methods (`.notFound()`, `.badRequest()`, etc.)
- `middlewares/errorHandler.ts` - Global error handler (logs with Winston, returns JSON)
- `config/logger.ts` - Winston logger setup (environment-aware formatting)
- `scripts/sql/init.sql` - Database schema with indexes and triggers

## Common Pitfalls

❌ Using `pool.query()` directly in controllers (use `query()` or `queryOne()`)  
❌ Using `queryOne()` inside `transaction()` callback (use `client.query()`)  
❌ Catching errors without preserving `AppError` instances (always check `instanceof AppError`)  
❌ Forgetting to validate required fields before database operations  
❌ Not using transactions for create/update operations with tags  
❌ Logging sensitive data (passwords, tokens) - never log these

## API Response Examples

```typescript
// Success with data
{ success: true, data: { id: 1, title: "...", tags: [...] } }

// Success with list
{ success: true, count: 5, data: [...] }

// Error (handled by errorHandler)
{ status: "error", message: "Note not found", isOperational: true }
```
