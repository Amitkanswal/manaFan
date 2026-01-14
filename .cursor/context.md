# MangaFan - Production-Ready Architecture

## Architecture: Feature-Based / Domain-Driven

This project follows a **feature-based architecture** where code is organized by business domain, not by technical type. This is the pattern used by enterprise applications at companies like Vercel, Stripe, and Airbnb.

## Directory Structure

```
src/
├── app/                      # Next.js App Router (routes only)
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   ├── manga/
│   │   └── [id]/
│   │       └── page.tsx      # Manga detail page
│   └── globals.css           # Global styles
│
├── core/                     # App-wide infrastructure
│   ├── config/               # Configuration constants
│   │   └── index.ts
│   └── providers/            # React Context providers
│       ├── theme-provider.tsx
│       └── index.tsx
│
├── shared/                   # Shared across all features
│   ├── components/
│   │   └── ui/               # Primitive UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── skeleton.tsx
│   │       └── index.ts
│   ├── hooks/                # Shared custom hooks
│   ├── lib/                  # Utilities
│   │   └── utils.ts
│   └── types/                # Shared TypeScript types
│       └── index.ts
│
└── features/                 # Feature modules (domain-driven)
    ├── manga/                # Manga feature
    │   ├── components/       # Feature-specific components
    │   │   ├── manga-card.tsx
    │   │   ├── manga-grid.tsx
    │   │   └── manga-hero.tsx
    │   ├── hooks/            # Feature-specific hooks
    │   │   └── use-manga.ts
    │   ├── services/         # Feature-specific API
    │   │   ├── api.ts
    │   │   └── mock-data.ts
    │   ├── types.ts          # Feature types
    │   └── index.ts          # Public API (exports)
    │
    └── reader/               # Reader feature
        ├── components/
        │   └── reader.tsx
        ├── hooks/
        │   └── use-reader.ts
        ├── types.ts
        └── index.ts
```

## Key Principles

### 1. Feature Isolation
Each feature is self-contained with its own components, hooks, services, and types. Features only expose what's needed through their `index.ts` file.

### 2. Clean Imports
```typescript
// Import from feature's public API
import { useMangaList, MangaCard, Manga } from '@/features/manga';

// Import shared utilities
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui';
```

### 3. Colocation
Related files are kept together. A feature's API, hooks, components, and types all live in the same folder.

### 4. Thin Routes
App Router pages are thin wrappers that compose feature components. Business logic lives in features.

## Adding a New Feature

1. Create folder: `src/features/[feature-name]/`
2. Add types: `types.ts`
3. Add services: `services/api.ts`
4. Add hooks: `hooks/use-[feature].ts`
5. Add components: `components/[component].tsx`
6. Export public API: `index.ts`

## Technologies
- **Next.js 14** (App Router)
- **TypeScript 5.7**
- **Tailwind CSS 3.4**
- **Lucide React** (Icons)
