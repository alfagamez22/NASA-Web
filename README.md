# SCC RAN Portal — Vortex

Network Access Service & Assurance — Domestic Service Operation Center portal, built with Next.js 15 App Router.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v3 + custom brutal design system
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript

## Project Structure

```
scc-ran-portal/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx          # Root layout (Header + Footer)
│   │   ├── page.tsx            # Home (/)
│   │   ├── know-more/page.tsx  # Know More (/know-more)
│   │   ├── tracker/page.tsx    # Tracker (/tracker)
│   │   ├── report/page.tsx     # Report (/report)
│   │   ├── team/page.tsx       # Team (/team)
│   │   └── globals.css         # Global styles + Tailwind
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx      # Sticky nav with active state
│   │   │   ├── Footer.tsx      # Footer with QR mock
│   │   │   ├── SearchModal.tsx # Fullscreen search overlay
│   │   │   └── Marquee.tsx     # Animated marquee strip
│   │   ├── sections/
│   │   │   ├── HomeSection.tsx
│   │   │   ├── KnowMoreSection.tsx
│   │   │   ├── TrackerSection.tsx
│   │   │   ├── ReportSection.tsx
│   │   │   └── TeamSection.tsx
│   │   └── ui/
│   │       ├── ToolCard.tsx    # Tool link card (default + search variants)
│   │       ├── TeamMember.tsx  # Image + list variants with hover sync
│   │       └── TechCard.tsx    # 2G/3G/LTE/5G cards
│   ├── data/
│   │   ├── tools.ts            # All web tool categories and entries
│   │   ├── teams.ts            # Team + member data
│   │   └── navigation.ts      # Nav items with href mappings
│   └── lib/
│       ├── types.ts            # Shared TypeScript interfaces
│       └── constants.ts        # Site-wide constants
├── public/
│   └── images/                 # Static assets
├── .env.local                  # Environment variables (not committed)
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Differences from Vite Version

| Vite (original) | Next.js (this project) |
|---|---|
| Single `App.tsx` with `useState` for routing | File-based routing via App Router |
| `motion/react` (Motion library) | `framer-motion` |
| Tailwind CSS v4 (`@theme`, `@import "tailwindcss"`) | Tailwind CSS v3 (`@tailwind base/components/utilities`) |
| `<img>` tags | `next/image` `<Image>` with `remotePatterns` |
| `react-router` not used (SPA) | Next.js `Link` + `usePathname` for active nav |
| `Math.random()` in Footer QR | Static pattern (avoids hydration mismatch) |
| `vite.config.ts` env injection | `.env.local` + `next.config.js` |

## Updating Content

- **Add/edit tools** → `src/data/tools.ts`
- **Add/edit team members** → `src/data/teams.ts`
- **Contact numbers** → `src/lib/constants.ts`
- **Nav items** → `src/data/navigation.ts`
