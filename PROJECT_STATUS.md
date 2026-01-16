# OBS Workout Plugin - Project Status

## Overview

Building an OBS web overlay plugin using **Next.js 16** (App Router) that displays real-time heart rate (Stromno) and blood glucose (Dexcom) data as browser source overlays.

## Current Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Stromno API    │ ◄────────────────► │  Server         │
│  (Pulsoid)      │                    │  (stromnoManager│
└─────────────────┘                    │   singleton)    │
                                       └────────┬────────┘
                                               │ SSE
                                               ▼
                                       ┌─────────────────┐
                                       │  Browser        │
                                       │  Clients        │
                                       │  (/heartrate,   │
                                       │   /admin, etc)  │
                                       └─────────────────┘
```

## Tech Stack

- **Framework**: Next.js 16.1.2 (App Router with Turbopack)
- **UI**: React 19, Tailwind CSS 4
- **State**: Zustand for client-side state
- **Data Fetching**: TanStack React Query
- **Validation**: Zod for API responses and env parsing
- **Charts**: Recharts
- **Server**: Next.js Route Handlers for API, WebSocket via `ws` package

## File Structure

```
app/
├── layout.tsx                 # Root layout with React Query provider
├── providers.tsx              # Client-side providers (React Query)
├── globals.css                # Tailwind CSS + shadcn theme
├── page.tsx                   # Home page with setup instructions
├── admin/
│   └── page.tsx               # Admin settings page
├── heartrate/
│   └── page.tsx               # Heart rate overlay for OBS
├── glucose/
│   └── page.tsx               # Blood glucose overlay for OBS
└── api/
    └── stromno/
        ├── connect/route.ts   # POST - Connect to Stromno
        ├── disconnect/route.ts# POST - Disconnect from Stromno
        └── stream/route.ts    # GET - SSE endpoint for heart rate

lib/
├── utils.ts                   # cn() helper for Tailwind classes
├── env.ts                     # Zod env validation
└── stromno-manager.ts         # Server-side Stromno manager (WebSocket + SSE)

stores/
├── heartrate.ts               # Zustand store for heart rate
└── glucose.ts                 # Zustand store for blood glucose

components/
└── overlays/
    └── MiniChart.tsx          # Recharts mini graph component

services/
└── stromno.ts                 # Client-side Stromno service (React Query hooks + SSE subscription)
```

## Completed

- [x] Next.js 16 project setup with App Router
- [x] Tailwind CSS 4 with shadcn/ui theming
- [x] React Query provider setup
- [x] Zod schemas for API validation
- [x] Zustand stores for heart rate and glucose state
- [x] MiniChart component with Recharts for displaying graphs
- [x] Overlay routes (`/heartrate`, `/glucose`) for OBS browser sources
- [x] Admin page (`/admin`) for managing connections
- [x] Home page with quick setup instructions
- [x] Server-side StromnoManager class:
  - Parses widget URL to extract UUID
  - Fetches widget config via JSON-RPC
  - Connects to Stromno WebSocket server-side
  - Maintains connection state and 360-point history buffer
  - Broadcasts to SSE subscribers
- [x] API Routes:
  - `POST /api/stromno/connect` - Connect to Stromno
  - `POST /api/stromno/disconnect` - Disconnect from Stromno
  - `GET /api/stromno/stream` - SSE endpoint
- [x] React Query hooks for connect/disconnect mutations
- [x] Client-side SSE subscription with auto-reconnect

## Still TODO

### Stromno Integration (In Progress)

- [ ] Test end-to-end connection flow with real Stromno widget
- [ ] Verify SSE streaming works in browser
- [ ] Test overlay updates in OBS browser source
- [ ] Add error handling UI for connection failures

### Dexcom Integration (Not Started)

- [ ] Research Dexcom API / Share API
- [ ] Create server-side Dexcom manager (similar to Stromno)
- [ ] Add glucose SSE endpoint
- [ ] Connect glucose overlay to real data
- [ ] Add Dexcom settings to admin page

### Polish

- [ ] Persist settings (widget URLs, credentials) to storage
- [ ] Add loading states and better error messages
- [ ] Style overlays for OBS (transparent backgrounds, etc.)
- [ ] Add configuration options (graph duration, colors, etc.)
- [ ] Test with actual OBS browser source

## How Stromno Works

1. User provides a Stromno widget URL like: `https://stromno.com/widget/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. Server extracts the UUID from the URL
3. Server calls Stromno JSON-RPC API to get widget config (includes WebSocket URL)
4. Server connects to WebSocket at `wss://ramiel.pulsoid.net/listen/[UUID]`
5. Heart rate messages arrive as: `{ timestamp, data: { heartRate: number } }`
6. Server broadcasts to all connected SSE clients

## URLs

- **Home**: http://localhost:3000/
- **Admin**: http://localhost:3000/admin
- **Heart Rate Overlay**: http://localhost:3000/heartrate
- **Glucose Overlay**: http://localhost:3000/glucose
- **SSE Endpoint**: http://localhost:3000/api/stromno/stream

## Notes

- Heart rate updates every ~5 seconds from Stromno
- Blood glucose updates every 5 minutes from Dexcom
- Overlays show 30-minute history window
- Server maintains 360 data points (6 minutes at 1 point/second for HR)
