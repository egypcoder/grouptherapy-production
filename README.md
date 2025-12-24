# GroupTherapy Records - Production Website

# GroupTherapy — Music Platform + Admin CMS

A modern music label platform built with **React + TypeScript + Vite**, backed by **Supabase (Postgres + Auth + Storage)** and optional real-time radio features via **Firebase Realtime Database**.

This repo includes:

- A public website (releases, artists, events, radio, news, etc.)
- A full admin dashboard (content management + analytics)
- Real-time radio UX primitives (listener count, chat, sessions) when Firebase is configured
- Built-in analytics tracking stored in Supabase
- Optional AI content generation (Gemini) + Spotify metadata fetch

## Table of Contents

- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Architecture (How it works)](#architecture-how-it-works)
- [Features](#features)
- [Routes](#routes)
- [Getting Started (Local Dev)](#getting-started-local-dev)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Admin Access](#admin-access)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Highlights

- Modern UI/UX
  - TailwindCSS + shadcn/ui
  - Framer Motion animations
  - Mobile-first admin (responsive grids + mobile-friendly dialogs)

- Production-minded
  - Strongly typed domain models (`db` layer)
  - TanStack Query for caching and async workflows
  - Centralized analytics tracking (`db.analytics.*`)

- Integrated platform features
  - Spotify metadata fetch for releases/playlists
  - Pluggable email providers for newsletters
  - Optional Cloudinary uploader utilities

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite 5
- TailwindCSS
- shadcn/ui (Radix UI primitives)
- TanStack Query
- Wouter
- Framer Motion

### Backend / Services

- Supabase
  - Postgres database
  - Authentication (admin login)
  - Storage helpers (upload image/audio/video)
- Firebase Realtime Database (optional)
  - Live listener count
  - Live chat
  - Current radio session metadata
- Google Gemini API (optional)
  - AI generation for admin posts/newsletters
- Spotify API (optional)
  - Metadata fetch from URLs
- Cloudinary (optional)
  - Upload helpers with progress + large file handling

## Architecture (How it works)

- UI lives in `client/src`.
- Routing is handled via `wouter` in `client/src/App.tsx`.
- Data access is centralized in `client/src/lib/database.ts` (`db.*`).
  - The app maps database columns between `snake_case` and `camelCase`.
- Server state uses TanStack Query (`client/src/lib/queryClient.ts`).
- Admin protection uses Supabase auth session (`ProtectedRoute`).
- Analytics:
  - Public routes automatically call `db.analytics.trackPageView()`.
  - Key actions call `db.analytics.trackEvent()`.
- Radio:
  - Public radio uses `RadioProvider`.
  - If Firebase is not configured, the UI falls back gracefully.

## Features

### Public Website

- Home
  - Hero content + marquee + stats driven from Site Settings
- Releases
  - Index + detail pages
  - Outbound clicks tracked (analytics)
- Artists
  - Index + detail pages
- Events
  - Index + detail pages
  - Ticket click tracking
- News / Posts
  - Index + post detail
- Radio
  - Global player + show schedule
  - Live chat + listener tracking (when Firebase configured)
- Videos / Playlists / Tours / Careers / Press
- Static legal pages: `/terms`, `/privacy`, `/cookies`

### Admin Dashboard

Accessible under `/admin` (requires Supabase authentication).

- Dashboard
  - KPIs + charts + quick actions
  - Recent activity snapshot
- Content management
  - Artists
  - Releases (with Spotify metadata fetch)
  - Events
  - Posts (with optional AI generation)
  - Videos
  - Playlists (with Spotify metadata fetch)
  - Tours
  - Press Kit assets
  - Testimonials
  - Awards (categories, periods, nominees)
  - Static pages (Markdown editor)
- Operations
  - Contacts inbox
  - Newsletters
    - Email provider configuration
    - Compose + send to active subscribers
    - Optional AI generation
- SEO
  - SEO settings for global meta + structured data

## Routes

### Public

- `/` — Home
- `/releases` — Releases index
- `/releases/:slug` — Release detail
- `/artists` — Artists index
- `/artists/:slug` — Artist detail
- `/events` — Events index
- `/events/:slug` — Event detail
- `/news` — News/posts index
- `/news/:slug` — Post detail
- `/radio` — Radio
- `/videos` — Videos
- `/playlists` — Playlists
- `/tours` — Tours
- `/careers` — Careers
- `/press` — Press
- `/terms`, `/privacy`, `/cookies` — Static pages

### Admin

- `/admin/login`
- `/admin` — Dashboard
- `/admin/artists`
- `/admin/releases` (and `/admin/releases/:id`)
- `/admin/events` (and `/admin/events/:id`)
- `/admin/posts` (and `/admin/posts/:id`)
- `/admin/videos`
- `/admin/playlists`
- `/admin/radio`
- `/admin/tours`
- `/admin/press-kit`
- `/admin/static-pages`
- `/admin/testimonials`
- `/admin/awards`
- `/admin/seo-settings`
- `/admin/contacts`
- `/admin/newsletters`
- `/admin/settings`

## Getting Started (Local Dev)

### Prerequisites

- Node.js 18+
- A Supabase project (required)
- Firebase project (optional, for radio real-time)

### Install

```bash
npm install
```

### Configure env

Create a `.env` file at repo root.

See: [Environment Variables](#environment-variables)

### Run

```bash
npm run dev
```

Vite is configured to start on port `5000`, but if it’s already in use it will automatically try another port.

### Typecheck

```bash
npm run check
```

## Environment Variables

This project is a Vite app, so client-side config must be prefixed with `VITE_`.

### Required

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Optional (feature-gated)

#### Firebase (Radio real-time)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Gemini (AI generation)

- `VITE_GEMINI_API_KEY`

#### Spotify (metadata fetch)

- `VITE_SPOTIFY_CLIENT_ID`
- `VITE_SPOTIFY_CLIENT_SECRET`

#### Cloudinary (uploads)

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

#### Email providers (Newsletters)

Email can be configured via the Admin UI (stored in Site Settings) or via environment variables.

- `VITE_EMAIL_SERVICE` = `resend` | `sendgrid` | `ses` | `smtp`
- `VITE_EMAIL_FROM`

Provider-specific:

- Resend: `VITE_RESEND_API_KEY`
- SendGrid: `VITE_SENDGRID_API_KEY`
- SES: `VITE_SES_API_URL`
- SMTP: `VITE_EMAIL_API_URL`

## Database Setup

There are two schema sources in the repo:

- `client/src/lib/supabase-schema.sql`
- `docs/*.sql` migrations

Recommended path:

1. Start with `docs/db-schema-fixed.sql`
2. Apply `docs/migration-new-tables.sql`
3. Apply `docs/migration-email-service-config.sql` (if using newsletters)
4. Optionally seed with `docs/seed-data.sql`

For deeper setup notes (RLS policies, Firebase rules, etc.) see `SETUP.md`.

## Admin Access

- Admin pages are guarded by `ProtectedRoute`.
- Authentication uses Supabase Auth.

Important implementation detail:

- The current auth layer treats any authenticated Supabase user as admin in the UI.
- For production security, enforce Row Level Security (RLS) in Supabase (see `SETUP.md`).

## Deployment

This is a static SPA built by Vite.

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

See `DEPLOYMENT.md` for Vercel/Netlify/self-hosted guidance.

## Project Structure

- `client/src/App.tsx` — Route map + layouts
- `client/src/pages/*` — Public pages
- `client/src/pages/admin/*` — Admin pages
- `client/src/components/*` — Feature components
- `client/src/components/ui/*` — shadcn/ui primitives
- `client/src/lib/database.ts` — Supabase data layer
- `client/src/lib/queryClient.ts` — TanStack Query config
- `client/src/lib/radio-context.tsx` — Radio playback + realtime wiring
- `docs/*` — SQL migrations + setup notes

## Troubleshooting

### "Supabase is not configured"

- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.

### Firebase features not working

- The UI will fall back if Firebase is missing.
- If you need real-time features, set all `VITE_FIREBASE_*` vars.

### AI generation not available

- Add `VITE_GEMINI_API_KEY`.

### Spotify metadata fetch fails

- Add `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_CLIENT_SECRET`.
