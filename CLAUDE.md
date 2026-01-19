# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OBS web overlay plugin built with Next.js 16 (App Router) that displays real-time heart rate (Stromno/Pulsoid) and blood glucose (Dexcom) data as browser source overlays for livestreams.

## Commands

```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Production build
pnpm check            # Run lint, format check, and typecheck
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm dlx shadcn@latest add [component]  # Add shadcn components
```

## Architecture

**Data Flow:**

```
External API → Server Manager → SSE Stream → Browser → Zustand Store → Components
```

**Key Components:**

- **Server Managers** (`lib/stromno-manager.ts`, `lib/dexcom-manager.ts`): Global singletons that manage external API connections, maintain data history buffers, and broadcast to SSE subscribers
- **SSE Endpoints** (`app/api/*/stream/route.ts`): Server-Sent Events for real-time data streaming to browsers
- **Zustand Stores** (`stores/`): Client-side state for current values and history
- **Services** (`services/`): React Query hooks for API mutations + SSE subscription logic
- **Database** (`lib/db.ts`): SQLite with better-sqlite3 for settings persistence

**Routes:**

- `/` - Home page with setup guide
- `/admin` - Settings & connection management
- `/heartrate` - Heart rate OBS overlay (use as browser source)
- `/glucose` - Glucose OBS overlay (use as browser source)

## Key Patterns

- Singleton pattern for server-side managers with subscriber broadcasting
- SSE auto-reconnect on client disconnect
- Zod validation for all external API responses
- Circular buffers for data history (360 points heart rate, 72 points glucose)
- Path alias: `@/*` resolves to project root

## Integrations

**Stromno/Pulsoid:** Widget URL → JSON-RPC API → WebSocket connection → broadcasts updates every ~5 seconds

**Dexcom:** Username/password/region → Session authentication → Polls every 60 seconds → broadcasts glucose with trend indicators
