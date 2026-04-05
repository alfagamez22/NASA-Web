# SCC RAN Portal — Setup & Architecture Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Prisma Studio](#prisma-studio)
- [Authentication](#authentication)
- [Architecture Overview](#architecture-overview)
- [API Routes Reference](#api-routes-reference)
- [Project Structure](#project-structure)
- [Deployment to Vercel](#deployment-to-vercel)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env .env.local
# Edit .env.local with your actual DATABASE_URL and AUTH_SECRET

# 3. Generate the Prisma client
npx prisma generate

# 4. Run database migrations (creates all tables)
npx prisma migrate dev --name init

# 5. Seed the database with default data
npx prisma db seed

# 6. Start the development server
npm run dev
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Database ────────────────────────────────────────────────────────
# Standard PostgreSQL connection string (for runtime via @prisma/adapter-pg)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# ─── NextAuth ────────────────────────────────────────────────────────
# Generate with: npx auth secret
AUTH_SECRET="your-random-secret-here"

# The canonical URL of your app (no trailing slash)
NEXTAUTH_URL="http://localhost:3000"
```

| Variable       | Description                                                    | Required |
| -------------- | -------------------------------------------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string used by both Prisma CLI and runtime | Yes      |
| `AUTH_SECRET`   | Random string for signing JWT tokens (NextAuth)               | Yes      |
| `NEXTAUTH_URL` | Base URL of the application                                    | Yes      |

### Generating AUTH_SECRET

```bash
npx auth secret
# or manually:
openssl rand -base64 32
```

---

## Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL locally (or use Docker):
   ```bash
   # Docker one-liner:
   docker run -d --name scc-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
   ```
2. Set `DATABASE_URL` in `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scc_ran_portal"
   ```

### Option B: Vercel Postgres (Production)

1. Go to your Vercel project → **Storage** → **Create Database** → **Postgres**
2. Copy the `POSTGRES_URL` from the connection details
3. Set it as `DATABASE_URL` in your Vercel environment variables

### Option C: Neon (Standalone)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string and set it as `DATABASE_URL`

### Running Migrations

```bash
# Create and apply migrations (development)
npx prisma migrate dev --name describe_your_change

# Apply existing migrations in production
npx prisma migrate deploy
```

### Seeding the Database

The seed script (`prisma/seed.ts`) imports all data from the JSON files in `src/data/` and creates:

- **1 admin user** — username: `admin`, password: `harveybuan123`
- **Tool categories** with nested tools (from `categories.json`)
- **Content sections** with media, links, and slides (from `sections.json`)
- **Modules** / navigation items (from `modules.json`)
- **Spine members** (leadership team)
- **Teams** with members (head, TL, ATL, engineers)
- **Team Drive categories** with items
- **Vortex configuration**, categories, items, and credits

```bash
npx prisma db seed
```

The seed uses `upsert` operations, so it's safe to re-run — existing records are updated, not duplicated.

> **Important**: Change the default admin password immediately after first login.

---

## Prisma Studio

Prisma Studio is a visual database browser that lets you view and edit data directly.

### Local (Development)

```bash
npx prisma studio
```

This opens a browser tab at `http://localhost:5555` where you can:

- Browse all tables and their data
- Create, edit, and delete records
- View and navigate relationships
- Filter and sort data

### Deployed / Remote Database

To connect Prisma Studio to a remote database (e.g., Vercel Postgres):

```bash
# Set DATABASE_URL to your production connection string, then:
DATABASE_URL="postgresql://..." npx prisma studio
```

Alternatively, use the [Prisma Data Platform](https://www.prisma.io/data-platform) for a hosted Studio experience:

1. Go to [cloud.prisma.io](https://cloud.prisma.io)
2. Create a project and connect your database
3. Use the web-based Studio to manage data

> **Warning**: Be careful editing production data directly. Always prefer the API routes for data mutations in production.

---

## Authentication

### How It Works

The app uses **NextAuth v5** with a **JWT strategy** and **credentials provider**:

1. User enters username + password on the login page
2. `signIn("credentials", ...)` sends credentials to NextAuth
3. NextAuth's `authorize()` function queries the `users` table and verifies the bcrypt-hashed password
4. On success, a JWT token is created containing `id`, `role`, and `username`
5. The JWT is stored in an HTTP-only cookie and sent with every request
6. API routes validate the session using `auth()` from NextAuth

### User Roles

| Role     | Permissions                                      |
| -------- | ------------------------------------------------ |
| `admin`  | Full access — create/edit/delete all data, manage users |
| `editor` | Can create/edit/delete content (tools, sections, teams, etc.) |
| `viewer` | Read-only access to the portal                   |

### Auth Flow Diagram

```
User → LoginPage → signIn("credentials") → NextAuth authorize()
                                               ↓
                                    Query users table (Prisma)
                                               ↓
                                    bcrypt.compare(password, hash)
                                               ↓
                                    JWT created → cookie set
                                               ↓
                                    AuthGate allows access
```

### Key Files

| File                                | Purpose                                           |
| ----------------------------------- | ------------------------------------------------- |
| `src/lib/auth.ts`                   | NextAuth configuration (providers, callbacks, JWT) |
| `src/lib/auth-context.tsx`          | React context wrapping `useSession()` for components |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route handler                  |
| `src/components/auth/AuthGate.tsx`  | Guards the app — shows login unless authenticated  |
| `src/components/auth/LoginPage.tsx` | Full-page login UI with NASA branding              |
| `src/components/auth/LoginModal.tsx`| Modal login (for in-app re-authentication)         |
| `src/app/api/_helpers.ts`           | `requireAuth`, `requireEditor`, `requireAdmin` helpers |

### Creating Additional Users

Use the `/api/users` endpoint (admin only) or Prisma Studio:

```bash
# Via API (requires admin session cookie)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepassword",
    "displayName": "New User",
    "role": "editor"
  }'
```

---

## Architecture Overview

### Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 15 (App Router, React 19)  |
| Language      | TypeScript (strict mode)            |
| Styling       | Tailwind CSS 3.4, CSS custom properties |
| Animation     | Framer Motion 11                    |
| Database      | PostgreSQL (via Vercel Postgres / Neon) |
| ORM           | Prisma 7.6 (`prisma-client` generator) |
| DB Adapter    | `@prisma/adapter-pg` (pg driver)    |
| Auth          | NextAuth v5 (JWT + Credentials)     |
| Password Hash | bcryptjs (12 salt rounds)           |
| Icons         | Lucide React                        |

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Client (React Components)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ HomeSection  │  │ TeamSection  │  │ KnowMore...  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │ (currently localStorage via data-store.ts)     │
│         │ (can be migrated to fetch() → API routes)      │
└─────────┼───────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────┐
│  API Routes (src/app/api/*)                              │
│  ┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┐ │
│  │/categs │ │/tools│ │/sections│ │/teams│ │/vortex   │ │
│  └────┬───┘ └──┬───┘ └────┬───┘ └──┬───┘ └────┬─────┘ │
│       │ Auth check (requireAuth/requireEditor/requireAdmin)
└───────┼────────┼──────────┼────────┼──────────┼────────┘
        ▼        ▼          ▼        ▼          ▼
┌─────────────────────────────────────────────────────────┐
│  Prisma ORM (src/lib/prisma.ts singleton)                │
│  PrismaClient + PrismaPg adapter                         │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                     │
│  20+ tables, 3 enums                                     │
└─────────────────────────────────────────────────────────┘
```

### Database Models

| Model              | Description                                   | Table Name              |
| ------------------ | --------------------------------------------- | ----------------------- |
| `User`             | Portal users with roles                       | `users`                 |
| `Session`          | Reserved for DB sessions (JWT currently used) | `sessions`              |
| `ViewerPermission` | Page-level access control for viewers          | `viewer_permissions`    |
| `ToolCategory`     | Groups of tools on the home page              | `tool_categories`       |
| `Tool`             | Individual tool links                         | `tools`                 |
| `ContentSection`   | Content blocks (know-more, reports, tracker)  | `content_sections`      |
| `SectionMedia`     | Embedded media within sections                | `section_media`         |
| `SectionLink`      | Links within sections                         | `section_links`         |
| `SlideItem`        | Slide items within sections                   | `slide_items`           |
| `SlideColumn`      | Columns within slide items                    | `slide_columns`         |
| `Module`           | Top-level navigation entities                 | `modules`               |
| `SpineMember`      | Leadership/spine team members                 | `spine_members`         |
| `Team`             | Engineering teams                             | `teams`                 |
| `TeamMember`       | Members of teams                              | `team_members`          |
| `TeamDriveCategory`| Team Drive link categories                    | `team_drive_categories` |
| `TeamDriveItem`    | Individual Team Drive links                   | `team_drive_items`      |
| `VortexCategory`   | Inside Vortex content categories              | `vortex_categories`     |
| `VortexItem`       | Items within Vortex categories                | `vortex_items`          |
| `VortexCredit`     | Vortex page credits                           | `vortex_credits`        |
| `VortexConfig`     | Singleton config for Vortex page              | `vortex_config`         |
| `ReportSlide`      | Report page slide embeds                      | `report_slides`         |
| `Notification`     | In-app change notifications                   | `notifications`         |

### Enums

| Enum             | Values                                    |
| ---------------- | ----------------------------------------- |
| `UserRole`       | `admin`, `editor`, `viewer`               |
| `MediaType`      | `google_slides`, `youtube`, `image`, `iframe` |
| `TeamMemberRole` | `head`, `tl`, `atl`, `engineer`           |

---

## API Routes Reference

All mutation endpoints require authentication. Role requirements noted below.

### Categories (`/api/categories`)

| Method | Auth     | Params / Body                                | Description                |
| ------ | -------- | -------------------------------------------- | -------------------------- |
| GET    | Any      | `?parent=slug`                               | List categories by parent  |
| POST   | Editor+  | `{ slug, title, parentSlug, order? }`        | Create category            |
| PUT    | Editor+  | `{ slug, title, parentSlug?, order? }`       | Update category by slug    |
| DELETE | Editor+  | `?slug=value`                                | Delete category by slug    |

### Tools (`/api/tools`)

| Method | Auth     | Params / Body                                         | Description              |
| ------ | -------- | ----------------------------------------------------- | ------------------------ |
| GET    | Any      | `?category=slug`                                      | List tools by category   |
| POST   | Editor+  | `{ slug, title, url, icon?, description?, categorySlug, order? }` | Create tool  |
| PUT    | Editor+  | `{ slug, title?, url?, icon?, ...}`                   | Update tool by slug      |
| DELETE | Editor+  | `?slug=value`                                         | Delete tool by slug      |

### Sections (`/api/sections`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Any      | `?parent=slug` or `?slug=value`                      | List sections (includes media/links/slides) |
| POST   | Editor+  | `{ slug, title, parentSlug, ... }`                   | Create section                     |
| PUT    | Editor+  | `{ slug, ... }`                                      | Update section by slug             |
| DELETE | Editor+  | `?slug=value`                                        | Delete section by slug             |

### Teams (`/api/teams`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Any      | `?type=spine` or default (returns teams with members) | List spine or teams               |
| POST   | Editor+  | `{ type: "spine"|"team"|"member", ... }`             | Create spine member, team, or member |
| PUT    | Editor+  | `{ type, id, ... }`                                  | Update by type and id              |
| DELETE | Editor+  | `?type=...&id=...`                                   | Delete by type and id              |

### Drive (`/api/drive`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Any      | —                                                    | List all categories with items     |
| POST   | Editor+  | `{ type: "category"|"item", ... }`                   | Create category or item            |
| PUT    | Editor+  | `{ type, id, ... }`                                  | Update                             |
| DELETE | Editor+  | `?type=...&id=...`                                   | Delete                             |

### Vortex (`/api/vortex`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Any      | —                                                    | Config + categories + credits      |
| POST   | Editor+  | `{ type: "config"|"category"|"item"|"credit", ... }` | Create                             |
| PUT    | Editor+  | `{ type, id?, ... }`                                 | Update                             |
| DELETE | Editor+  | `?type=...&id=...`                                   | Delete                             |

### Notifications (`/api/notifications`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Any      | —                                                    | Last 50 notifications              |
| POST   | Any      | `{ page, changeType, itemName }`                     | Create notification                |
| PUT    | Any      | `{ action: "markRead"|"markAllRead", id? }`          | Mark notification(s) read          |
| DELETE | Any      | —                                                    | Clear all notifications            |

### Users (`/api/users`)

| Method | Auth     | Params / Body                                        | Description                        |
| ------ | -------- | ---------------------------------------------------- | ---------------------------------- |
| GET    | Admin    | —                                                    | List all users (excludes password) |
| POST   | Admin    | `{ username, password, displayName, role }`          | Create user                        |
| PUT    | Admin    | `{ id, username?, password?, displayName?, role? }`  | Update user                        |
| DELETE | Admin    | `?id=value`                                          | Delete user (can't self-delete)    |

### Modules (`/api/modules`)

| Method | Auth     | Description              |
| ------ | -------- | ------------------------ |
| GET    | Any      | List all modules ordered |

---

## Project Structure

```
scc-ran-portal/
├── prisma/
│   ├── schema.prisma          # Database schema (20+ models, 3 enums)
│   ├── seed.ts                # Seed script — imports JSON → database
│   └── migrations/            # Auto-generated migration files
├── prisma.config.ts           # Prisma CLI config (datasource URL for migrations)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (fonts, metadata)
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles + CSS custom properties
│   │   ├── api/
│   │   │   ├── _helpers.ts    # Auth middleware (requireAuth/Editor/Admin)
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   │   ├── categories/route.ts
│   │   │   ├── tools/route.ts
│   │   │   ├── sections/route.ts
│   │   │   ├── teams/route.ts
│   │   │   ├── drive/route.ts
│   │   │   ├── vortex/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── users/route.ts
│   │   │   └── modules/route.ts
│   │   ├── know-more/page.tsx
│   │   ├── report/page.tsx    # + 2g/, 3g/, lte/ sub-pages
│   │   ├── team/page.tsx      # + drive/, inside-vortex/ sub-pages
│   │   ├── tracker/page.tsx
│   │   └── [...slug]/page.tsx # Dynamic catch-all route
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGate.tsx       # Auth wall — blocks unauthenticated access
│   │   │   ├── LoginPage.tsx      # Full-page login with NASA branding
│   │   │   └── LoginModal.tsx     # Modal login
│   │   ├── content/               # Reusable content components
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Top nav bar
│   │   │   ├── Footer.tsx         # Footer
│   │   │   ├── Providers.tsx      # SessionProvider → AuthProvider → EditModeProvider
│   │   │   ├── Marquee.tsx        # Scrolling marquee
│   │   │   └── SearchModal.tsx    # Global search
│   │   ├── sections/              # Page-specific section components
│   │   └── ui/                    # Small reusable UI components
│   ├── data/                      # Static JSON data (migrated to DB via seed)
│   ├── generated/prisma/          # Auto-generated Prisma client (do not edit)
│   ├── lib/
│   │   ├── prisma.ts              # Singleton PrismaClient with PrismaPg adapter
│   │   ├── auth.ts                # NextAuth config
│   │   ├── auth-context.tsx       # React auth context (wraps useSession)
│   │   ├── data-store.ts          # localStorage CRUD (legacy, used by components)
│   │   ├── content-service.ts     # Content data helpers
│   │   ├── constants.ts           # App constants
│   │   ├── types.ts               # TypeScript types
│   │   ├── slug-utils.ts          # URL slug utilities
│   │   └── ThemeContext.tsx        # Theme provider
│   ├── pages/                     # (empty, using App Router)
│   └── types/
│       └── next-auth.d.ts         # NextAuth type augmentation
├── .env                           # Default env (committed, non-secret)
├── .env.local                     # Local overrides (git-ignored)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### Key Definitions

| Term / File            | What It Is                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| `data-store.ts`        | Legacy localStorage-based CRUD layer. Components currently read/write here. Can be incrementally replaced with API fetch calls. |
| `prisma.ts`            | Creates a singleton `PrismaClient` instance using `@prisma/adapter-pg` for PostgreSQL connectivity. Cached on `globalThis` to survive Next.js hot reloads. |
| `auth.ts`              | Configures NextAuth with JWT strategy and Credentials provider. The `authorize` function looks up the user in the DB and verifies bcrypt password hash. JWT callbacks inject `role` and `username` into the token. |
| `auth-context.tsx`     | React context that wraps NextAuth's `useSession()` hook. Provides `login()`, `logout()`, `user`, `loading` to all components. |
| `Providers.tsx`        | Nests `SessionProvider` (NextAuth) → `AuthProvider` → `EditModeProvider` → `AuthGate` → page content. |
| `AuthGate.tsx`         | Checks session status. Shows a loading animation while the session is being fetched, the login page if unauthenticated, or the actual content if authenticated. |
| `_helpers.ts`          | Server-side auth middleware. `requireAuth()` checks for a valid session. `requireEditor()` requires admin or editor role. `requireAdmin()` requires admin role. All return `{ error, session }`. |
| `prisma.config.ts`     | Prisma CLI configuration file. Contains the `DATABASE_URL` for running migrations and seeds via the Prisma CLI. |

---

## Deployment to Vercel

### Prerequisites

- Vercel account with a linked GitHub repository
- Vercel Postgres database created (or external PostgreSQL)

### Steps

1. **Create Vercel Postgres database**
   - Go to Vercel Dashboard → Storage → Create Database → Postgres
   - Note the connection details

2. **Set environment variables in Vercel**
   ```
   DATABASE_URL=postgresql://...  (from Vercel Postgres)
   AUTH_SECRET=<generate with: npx auth secret>
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Configure build command**
   In `vercel.json` or Vercel project settings:
   ```json
   {
     "buildCommand": "npx prisma generate && npx prisma migrate deploy && next build"
   }
   ```

4. **Seed the production database** (one-time)
   After the first deployment, seed from your local machine:
   ```bash
   DATABASE_URL="postgresql://your-prod-url" npx prisma db seed
   ```

5. **Deploy**
   ```bash
   git push origin main
   # Vercel auto-deploys on push
   ```

### Post-Deployment Checklist

- [ ] Change the default admin password (`admin` / `harveybuan123`)
- [ ] Verify `AUTH_SECRET` is a strong random value
- [ ] Confirm database tables were created (`npx prisma migrate deploy`)
- [ ] Test login flow on production URL
- [ ] Verify API routes return data (e.g., `GET /api/categories`)

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run start                  # Start production server

# Prisma
npx prisma generate            # Regenerate client after schema changes
npx prisma migrate dev          # Create + apply migration (dev only)
npx prisma migrate deploy       # Apply migrations in production
npx prisma db seed              # Run seed script
npx prisma studio               # Open visual database browser
npx prisma format               # Format schema file

# Auth
npx auth secret                 # Generate a new AUTH_SECRET value
```

---

## Troubleshooting

### "PrismaClient is not a constructor"
Run `npx prisma generate` — the generated client may be out of date.

### "Can't reach database server"
Check that `DATABASE_URL` in `.env.local` points to a running PostgreSQL instance and the connection string format is `postgresql://user:password@host:port/database`.

### "NEXTAUTH_URL mismatch"
Ensure `NEXTAUTH_URL` matches your actual app URL. For local dev: `http://localhost:3000`. For production: `https://your-domain.vercel.app`.

### Build fails with type errors in `prisma/seed.ts`
The seed file is excluded from the Next.js type check via `tsconfig.json`. If you see errors, ensure `"prisma/seed.ts"` is in the `exclude` array.

### "Expected 1 arguments, but got 0" for PrismaClient
Prisma v7 requires a driver adapter. The `src/lib/prisma.ts` file passes `@prisma/adapter-pg` — ensure the `DATABASE_URL` environment variable is set.
