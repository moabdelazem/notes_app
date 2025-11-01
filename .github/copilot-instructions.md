# Notes API - AI Coding Agent Instructions

## Architecture Overview

This is a **TypeScript/Express REST API** for a notes application with PostgreSQL. The architecture follows a layered pattern:

- **Entry**: `server.ts` → `app.ts` (Express setup) → `routes/` → `controllers/` → `database/db.ts`
- **Key Pattern**: Controllers use database helper functions (`query`, `queryOne`, `transaction`) from `database/db.ts`, NOT direct pool access
- **Error Handling**: Custom `AppError` class with status codes, caught by global `errorHandler` middleware

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
# Start PostgreSQL (Docker)
npm run dev_database:up

# Start dev server (nodemon + ts-node)
npm run dev

# Database init runs automatically via docker-entrypoint-initdb.d/init.sql
```

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
