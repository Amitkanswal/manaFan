# MangaFan: Contentstack CMS & Microservices Integration
## Presentation Overview Document

---

## Executive Summary

**MangaFan** is a modern manga reading platform that demonstrates enterprise-level integration with **Contentstack CMS** and its microservices ecosystem. This document provides an overview of how Contentstack's headless CMS, Delivery API, Content Management API, Personalize Edge SDK, and Webhooks/Automate work together to power a dynamic, personalized content experience.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Contentstack CMS Integration](#3-contentstack-cms-integration)
4. [Delivery API (CDN) Integration](#4-delivery-api-cdn-integration)
5. [Content Management API (CMA)](#5-content-management-api-cma)
6. [Contentstack Personalize Integration](#6-contentstack-personalize-integration)
7. [Webhooks & Automate Integration](#7-webhooks--automate-integration)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Key Features Powered by Contentstack](#9-key-features-powered-by-contentstack)
10. [Demo Script](#10-demo-script)
11. [Technical Implementation Details](#11-technical-implementation-details)

---

## 1. Project Overview

### What is MangaFan?

MangaFan is a full-featured manga reading platform built with:
- **Next.js 14** (React framework with App Router)
- **TypeScript** for type safety
- **Contentstack** as the headless CMS
- **Prisma + SQLite** for user data (local database)
- **Tailwind CSS** for styling

### Key Business Requirements Solved by Contentstack

| Requirement | Contentstack Solution |
|-------------|----------------------|
| Content Management | Headless CMS with structured content types |
| Global Content Delivery | Delivery API (CDN) for fast, cached responses |
| Content Categorization | Taxonomies for genres and status |
| Real-time Personalization | Personalize Edge SDK |
| Content-triggered Automation | Webhooks + Automate |
| Backend Updates | Content Management API (CMA) |

---

## 2. Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MangaFan Application (Next.js)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐           │
│   │   Frontend     │    │   API Routes   │    │   Providers    │           │
│   │   (React)      │    │   (Next.js)    │    │   (Context)    │           │
│   └───────┬────────┘    └───────┬────────┘    └───────┬────────┘           │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                            │
│                    ┌────────────┴────────────┐                              │
│                    │     lib/contentstack/   │                              │
│                    │    (SDK Abstraction)    │                              │
│                    └────────────┬────────────┘                              │
│                                 │                                            │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────────────┐
         │                        │                                │
         ▼                        ▼                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────────────┐
│  Contentstack   │    │   Contentstack   │    │     Contentstack           │
│  Delivery API   │    │       CMA        │    │      Personalize           │
│    (CDN)        │    │   (Management)   │    │    (Edge SDK)              │
├─────────────────┤    ├──────────────────┤    ├────────────────────────────┤
│ • Read content  │    │ • Create entries │    │ • Audience segmentation    │
│ • Query entries │    │ • Update entries │    │ • A/B testing              │
│ • Taxonomy      │    │ • Taxonomy terms │    │ • Experience variants      │
│ • References    │    │ • Server-side    │    │ • Real-time personalization│
└─────────────────┘    └──────────────────┘    └────────────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────┐
                       │   Contentstack   │
                       │    Automate      │
                       │   (Webhooks)     │
                       ├──────────────────┤
                       │ • Content events │
                       │ • Notifications  │
                       │ • Data sync      │
                       └──────────────────┘
```

### Application Layer Structure

```
src/
├── lib/contentstack/          ← Contentstack SDK Integration Layer
│   ├── client.ts              ← Delivery SDK configuration
│   ├── api.ts                 ← Content fetching functions
│   ├── cma.ts                 ← Content Management API
│   ├── types.ts               ← TypeScript types for CS responses
│   └── index.ts               ← Public exports
│
├── core/providers/
│   └── personalize-provider.tsx  ← Personalize SDK integration
│
├── app/api/webhooks/contentstack/  ← Webhook endpoints
│   ├── new-chapter/route.ts       ← New chapter notifications
│   └── sync-stats/route.ts        ← Stats synchronization
```

---

## 3. Contentstack CMS Integration

### Content Model Design

MangaFan uses a well-structured content model in Contentstack:

#### Content Type: **Manga** (`manga`)

| Field | Type | Purpose |
|-------|------|---------|
| `title` | Single Line Text | Manga title |
| `url` | Single Line Text | URL slug for routing |
| `description` | Multi Line Text | Synopsis/description |
| `manga_image` | File | Cover image |
| `banner_image` | File | Hero banner image |
| `author` | Reference | Link to Author entry |
| `taxonomies` | Taxonomy | Genre and Status categorization |
| `rating` | Custom JSON | Rating stats (via custom extension) |

#### Content Type: **Manga List** (`manga_list`) - Chapters

| Field | Type | Purpose |
|-------|------|---------|
| `title` | Single Line Text | Chapter title ("Chapter 1") |
| `managa` | Reference | Link to parent Manga |
| `panel` | Modular Blocks | Chapter pages/images |
| `url` | Single Line Text | Chapter URL path |

#### Content Type: **Author** (`author`)

| Field | Type | Purpose |
|-------|------|---------|
| `title` | Single Line Text | Author name |
| `about_author` | Multi Line Text | Bio |
| `profile_icon` | File | Author avatar |

### Taxonomy Structure

**Genre Taxonomy** (`genre`):
- action, adventure, fantasy, comedy, romance, horror, mystery, supernatural, slice_of_life, shonen, reincarnation, magic

**Status Taxonomy** (`status`):
- ongoing, completed, hiatus

### Benefits of This Content Model

1. **Separation of Concerns**: Manga metadata separate from chapters
2. **Reusable References**: Authors linked across multiple manga
3. **Flexible Categorization**: Taxonomies allow multi-select genres
4. **CDN-Optimized Assets**: Images served via Contentstack's CDN

---

## 4. Delivery API (CDN) Integration

### SDK Configuration

```typescript
// src/lib/contentstack/client.ts
import Contentstack, { Region } from '@contentstack/delivery-sdk';

const stack = Contentstack.stack({
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT,
  region: Region.US,  // Supports US, EU, AZURE-NA, AZURE-EU
});
```

### Key API Methods Used

| Method | Purpose | Example |
|--------|---------|---------|
| `find()` | Fetch multiple entries | Get all manga |
| `fetch()` | Fetch single entry | Get manga by UID |
| `includeReference()` | Include linked content | Get manga with author |
| `only()` | Limit fields returned | Performance optimization |
| `locale()` | Set language | Multi-language support |

### Code Example: Fetching Manga List

```typescript
// src/lib/contentstack/api.ts
async getMangaList(filters?: MangaFilters): Promise<Manga[]> {
  // Fetch all manga entries with author references
  const mangaQuery = stack
    .contentType(CONTENT_TYPES.MANGA)
    .entry()
    .includeReference(['author'])  // Include linked author
    .includeFallback()
    .locale('en-us');

  const mangaResponse = await mangaQuery.find<CSManga>();
  const mangaEntries = mangaResponse.entries || [];

  // Fetch associated chapters
  const chaptersQuery = stack
    .contentType(CONTENT_TYPES.MANGA_LIST)
    .entry()
    .includeReference(['managa'])  // Include parent manga
    .includeFallback()
    .locale('en-us');

  const chaptersResponse = await chaptersQuery.find<CSMangaList>();
  const chapters = chaptersResponse.entries || [];

  // Transform and combine data
  return mangaEntries.map(m => transformManga(m, chapters));
}
```

### Data Transformation Layer

The API layer transforms Contentstack responses into application-specific types:

```typescript
function transformManga(csManga: CSManga, chapters: CSMangaList[]): Manga {
  // Extract genres from taxonomies
  const genres = csManga.taxonomies
    ?.filter(t => t.taxonomy_uid === 'genre')
    .map(t => t.name || t.term_uid) || [];

  // Extract status from taxonomies
  const statusTax = csManga.taxonomies?.find(t => t.taxonomy_uid === 'status');
  
  return {
    id: csManga.uid,
    slug: csManga.url || createSlug(csManga.title),
    title: csManga.title,
    author: csManga.author?.[0]?.title || 'Unknown',
    cover: csManga.manga_image?.url,
    banner: csManga.banner_image?.url,
    genres,
    status: normalizeStatus(statusTax?.name),
    // ... more fields
  };
}
```

### Similar Manga Feature (Taxonomy-Based)

Uses taxonomy data to find related content:

```typescript
async getSimilarManga(genres: string[], excludeUid: string, limit = 6): Promise<Manga[]> {
  // Normalize genres for comparison
  const normalizedGenres = genres.map(g => 
    g.toLowerCase().replace(/\s+/g, '_')
  );

  const mangaEntries = await this.getMangaList();
  
  // Score by genre overlap
  const scoredManga = mangaEntries
    .filter(entry => entry.uid !== excludeUid)
    .map(entry => {
      const entryGenres = entry.taxonomies
        ?.filter(t => t.taxonomy_uid === 'genre')
        .map(t => t.term_uid.toLowerCase()) || [];

      const overlapScore = normalizedGenres.filter(g => 
        entryGenres.includes(g)
      ).length;

      return { manga: entry, score: overlapScore };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredManga.slice(0, limit).map(item => item.manga);
}
```

---

## 5. Content Management API (CMA)

### Purpose

The CMA is used for **server-side operations** that require write access or administrative queries:
- Fetching unpublished content
- Taxonomy term management
- Advanced filtering queries

### Configuration

```typescript
// src/lib/contentstack/cma.ts
const CMA_BASE_URL = 'https://api.contentstack.io/v3';

const getCMAConfig = () => ({
  apiKey: process.env.CONTENTSTACK_API_KEY,
  managementToken: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
});
```

### Key CMA Methods

```typescript
export const cmaApi = {
  // Fetch entries with management token
  async getEntries(contentTypeUid: string, options?: {
    locale?: string;
    include_reference?: string[];
    query?: Record<string, unknown>;
  }): Promise<CMAEntriesResponse> {
    const response = await fetch(url, {
      headers: {
        'api_key': config.apiKey,
        'authorization': config.managementToken,
      },
    });
    return response.json();
  },

  // Fetch taxonomy terms
  async getTaxonomyTerms(taxonomyUid: string): Promise<CMATaxonomyResponse> {
    const url = `${CMA_BASE_URL}/taxonomies/${taxonomyUid}/terms`;
    // ... fetch with management token
  },

  // Filter by taxonomy
  async getEntriesByTaxonomy(contentTypeUid: string, taxonomyQuery: {
    taxonomyUid: string;
    termUid: string;
  }): Promise<CMAEntriesResponse> {
    const query = {
      [`taxonomies.${taxonomyQuery.taxonomyUid}`]: taxonomyQuery.termUid
    };
    // ... fetch with query parameter
  },
};
```

### Use Cases in MangaFan

| Use Case | CMA Method |
|----------|------------|
| Get all genre terms | `getTaxonomyTerms('genre')` |
| Filter manga by genre | `getEntriesByTaxonomy('manga', {genre})` |
| Admin dashboard data | `getEntries()` with query |

---

## 6. Contentstack Personalize Integration

### Overview

Contentstack Personalize provides **real-time, edge-based personalization** that enables:
- Audience segmentation
- A/B testing
- Personalized content variants
- User attribute tracking

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MangaFan Frontend                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │ PersonalizeProvider│   │ Contentstack     │    │ User Library     │      │
│  │ (SDK + Variants)  │◄──│ Client           │◄───│ Provider         │      │
│  │                    │   │ (CMS Content)    │    │ (Reading Data)   │      │
│  └────────┬───────────┘   └────────┬─────────┘    └──────────────────┘      │
│           │                        │                                         │
│           ▼                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Components                                   │   │
│  │  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │   │
│  │  │ Welcome      │  │ Personalized   │  │ Similar Manga           │  │   │
│  │  │ Banner       │  │ Recommendations│  │ Section                 │  │   │
│  │  └──────────────┘  └────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────────┐  ┌──────────────────────────────────────┐
│  Contentstack Personalize         │  │        Contentstack CMS               │
├───────────────────────────────────┤  ├──────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐      │  │  Personalized Content Types:          │
│  │ Audiences │ │Experiences│      │  │  • personalized_banner                │
│  │           │ │           │      │  │  • personalized_hero                  │
│  │• new_users│ │• welcome  │      │  │  • personalized_manga_list            │
│  │• returning│ │• hero     │      │  │                                       │
│  │• action   │ │• recommend│      │  │  Each entry has:                      │
│  │  readers  │ │           │      │  │  • experience_id                      │
│  │           │ │           │      │  │  • variant_id                         │
│  └───────────┘ └───────────┘      │  │  • personalized content               │
└───────────────────────────────────┘  └──────────────────────────────────────┘
```

### PersonalizeProvider Implementation

```typescript
// src/core/providers/personalize-provider.tsx
import Personalize from '@contentstack/personalize-edge-sdk';

export function PersonalizeProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeVariants, setActiveVariants] = useState({});
  const [genreWeights, setGenreWeights] = useState(new Map());

  // Initialize SDK
  useEffect(() => {
    const projectUid = process.env.NEXT_PUBLIC_PERSONALIZE_PROJECT_UID;
    
    const initializePersonalize = async () => {
      await Personalize.init(projectUid);
      setIsInitialized(true);

      // Get active experiences/variants
      const experiences = Personalize.getExperiences();
      const variants = {};
      Object.entries(experiences).forEach(([expId, variantId]) => {
        variants[expId] = String(variantId);
      });
      setActiveVariants(variants);
    };

    initializePersonalize();
  }, []);

  // Track manga reads for genre preferences
  const trackMangaRead = useCallback((mangaId, genres) => {
    // Update local preferences
    setGenreWeights(prevWeights => {
      const newWeights = new Map(prevWeights);
      genres.forEach(genre => {
        const normalizedGenre = normalizeGenre(genre);
        const count = newWeights.get(normalizedGenre) || 0;
        newWeights.set(normalizedGenre, count + 1);
      });
      return newWeights;
    });

    // Set attributes in Personalize
    const attributes = {};
    genres.forEach(genre => {
      attributes[`has_read_${normalizeGenre(genre)}`] = true;
    });
    Personalize.set(attributes);
    Personalize.triggerEvent('past_read');
  }, []);

  return (
    <PersonalizeContext.Provider value={{
      isInitialized,
      activeVariants,
      trackMangaRead,
      genreWeights,
      favoriteGenre,
      // ... more context values
    }}>
      {children}
    </PersonalizeContext.Provider>
  );
}
```

### Genre Tracking & Attributes

The app tracks user reading behavior and sends attributes to Personalize:

```typescript
const GENRE_ATTRIBUTES = {
  action: 'has_read_action',
  adventure: 'has_read_adventure',
  fantasy: 'has_read_fantasy',
  martial_arts: 'has_read_martial_arts',
  comedy: 'has_read_comedy',
  romance: 'has_read_romance',
  // ... more genres
};

// When user reads a manga
trackMangaRead(mangaId, ['action', 'adventure', 'fantasy']);
// → Sets attributes: has_read_action: true, has_read_adventure: true, etc.
// → Personalizes recommends action/adventure content to this user
```

### Audiences Defined in Personalize Dashboard

| Audience | Condition | Purpose |
|----------|-----------|---------|
| New Users | `session_count == 1` | Welcome message |
| Returning Users | `session_count > 1` | "Welcome back" message |
| Action Readers | `has_read_action == true` | Action recommendations |
| Fantasy Readers | `has_read_fantasy == true` | Fantasy recommendations |
| Heavy Readers | `chapters_read >= 50` | Power user features |

### Experiences & Variants

| Experience | Variants | Content Served |
|------------|----------|----------------|
| `welcome_exp` | `new_user`, `returning_user` | Welcome banners |
| `homepage_hero` | `action_fans`, `fantasy_fans`, `new_users` | Featured hero manga |
| `recommendations` | Genre-based variants | Personalized manga lists |

### Personalized Content from CMS

Content entries in CMS are tagged with `experience_id` and `variant_id`:

```typescript
// Fetch personalized banner based on variant
async getPersonalizedBanner(experienceId, variantId) {
  const entriesQuery = stack
    .contentType('personalized_banner')
    .entry()
    .locale('en-us');

  const response = await entriesQuery.find();
  
  // Find matching entry
  return response.entries.find(e => 
    e.experience_id === experienceId && 
    e.variant_id === variantId
  );
}
```

---

## 7. Webhooks & Automate Integration

### Overview

Contentstack Automate (Webhooks) enables **event-driven workflows** that trigger when content is published, updated, or deleted.

### Implemented Webhooks

#### 1. New Chapter Notification Webhook

**Trigger**: When a `manga_list` (chapter) entry is published

**Purpose**: Send email notifications to subscribed users

**Endpoint**: `POST /api/webhooks/contentstack/new-chapter`

```typescript
// src/app/api/webhooks/contentstack/new-chapter/route.ts
export async function POST(request: NextRequest) {
  // Verify webhook signature
  const rawBody = await request.text();
  const signature = request.headers.get('x-contentstack-signature');
  
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  
  // Only process publish events for chapters
  if (payload.event !== 'publish' || payload.content_type !== 'manga_list') {
    return NextResponse.json({ message: 'Event ignored' });
  }

  const entry = payload.entry;
  const chapterTitle = entry.title;
  const mangaRef = entry.managa?.[0];
  const mangaUid = mangaRef.uid;

  // Find subscribed users
  const subscriptions = await prisma.subscription.findMany({
    where: { mangaUid, notifyNewChapter: true },
    include: { user: true },
  });

  // Send notifications
  for (const sub of subscriptions) {
    await sendNewChapterNotification(
      sub.user.email,
      sub.user.name,
      mangaRef.title,
      mangaSlug,
      chapterTitle,
      chapterSlug
    );
  }

  return NextResponse.json({
    message: 'Notifications processed',
    notificationsSent: successCount,
  });
}
```

#### 2. Stats Sync Webhook

**Trigger**: When a `manga` entry is published/updated

**Purpose**: Initialize or update manga statistics in local database

**Endpoint**: `POST /api/webhooks/contentstack/sync-stats`

```typescript
// src/app/api/webhooks/contentstack/sync-stats/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json();
  
  if (payload.content_type !== 'manga') {
    return NextResponse.json({ message: 'Event ignored' });
  }

  const entry = payload.entry;
  const mangaUid = entry.uid;
  const mangaSlug = entry.url || mangaUid;

  // Upsert manga stats
  await prisma.mangaStats.upsert({
    where: { mangaUid },
    create: {
      mangaUid,
      mangaSlug,
      totalViews: 0,
      uniqueViewers: 0,
      avgRating: 0,
      totalRatings: 0,
      totalBookmarks: 0,
      totalSubscribers: 0,
    },
    update: { mangaSlug },
  });

  return NextResponse.json({
    message: 'Manga stats initialized/updated',
    mangaUid,
  });
}
```

### Webhook Security

```typescript
function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const expectedSignature = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Automate Workflow Diagram

```
┌─────────────────────┐
│   Content Editor    │
│  publishes chapter  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Contentstack CMS   │
│   Publish Event     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Automate        │
│  (Webhook Trigger)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    MangaFan API     │
│  /api/webhooks/...  │
└──────────┬──────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Database Query    │    │   Email Service     │
│ Find subscribed     │    │ Send notifications  │
│ users               │    │ to users            │
└─────────────────────┘    └─────────────────────┘
```

---

## 8. Data Flow Diagrams

### Content Fetch Flow

```
User visits manga detail page
         │
         ▼
┌─────────────────────────┐
│  Next.js Page Component │
│  [mangaSlug]/page.tsx   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ contentstackApi.        │
│ getMangaBySlug(slug)    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Contentstack Delivery   │
│ API (CDN)               │
├─────────────────────────┤
│ 1. Query manga entry    │
│ 2. Include author ref   │
│ 3. Include taxonomies   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Transform CS Response   │
│ to Manga type           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Render Manga Detail     │
│ + Similar Manga Section │
└─────────────────────────┘
```

### Personalization Flow

```
User visits MangaFan
         │
         ▼
┌─────────────────────────────┐
│ PersonalizeProvider         │
│ initializes SDK             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Load stored preferences     │
│ from localStorage           │
│ (genre weights, returning)  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Personalize.init(projectUid)│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Set attributes:             │
│ • has_read_action: true     │
│ • has_read_fantasy: true    │
│ • session_count: 5          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Personalize.getExperiences()│
│ Returns active variants:    │
│ • welcome_exp: returning    │
│ • recommendations: action   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Fetch CMS content matching  │
│ experience + variant        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Render personalized content │
│ • "Welcome back!" banner    │
│ • Action manga recommended  │
└─────────────────────────────┘
```

### Genre Tracking Flow

```
User opens manga detail page
         │
         ▼
┌─────────────────────────┐
│ trackMangaRead called   │
│ with manga genres       │
│ e.g., ['action', 'fantasy']
└────────────┬────────────┘
             │
             ├───────────────────────────────────────────┐
             │                                           │
             ▼                                           ▼
┌─────────────────────────┐                ┌─────────────────────────┐
│ Update localStorage     │                │ Personalize.set()       │
│ • genrePreferences      │                │ has_read_action: true   │
│ • genreWeights map      │                │ has_read_fantasy: true  │
└─────────────────────────┘                └────────────┬────────────┘
                                                        │
                                                        ▼
                                           ┌─────────────────────────┐
                                           │ Personalize.            │
                                           │ triggerEvent('past_read')
                                           └────────────┬────────────┘
                                                        │
                                                        ▼
                                           ┌─────────────────────────┐
                                           │ User now matches        │
                                           │ "Action Readers"        │
                                           │ audience                │
                                           └─────────────────────────┘
```

---

## 9. Key Features Powered by Contentstack

### Feature Matrix

| Feature | Contentstack Service | Description |
|---------|---------------------|-------------|
| **Manga Catalog** | Delivery API | All manga content from CMS |
| **Chapter Reading** | Delivery API + Assets | Panels served via CDN |
| **Genre Filtering** | Taxonomies | Filter by genre/status |
| **Similar Manga** | Taxonomies | Genre-based recommendations |
| **Personalized Welcome** | Personalize | New vs returning user banners |
| **Personalized Recommendations** | Personalize + CMS | Genre-based manga lists |
| **New Chapter Alerts** | Automate/Webhooks | Email notifications |
| **Stats Sync** | Webhooks + CMA | Keep local DB in sync |

### "Similar Manga" Feature

Component: `SimilarMangaSection.tsx`

```typescript
export function SimilarMangaSection({ currentMangaId, genres, maxItems = 6 }) {
  const [similarManga, setSimilarManga] = useState([]);

  useEffect(() => {
    const fetchSimilarManga = async () => {
      // Uses taxonomy overlap scoring
      const results = await contentstackApi.getSimilarManga(
        genres,
        currentMangaId,
        maxItems
      );
      setSimilarManga(results);
    };
    fetchSimilarManga();
  }, [currentMangaId, genres, maxItems]);

  return (
    <section>
      <h3>You Would Also Like</h3>
      <div className="grid">
        {similarManga.map(manga => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </section>
  );
}
```

### Personalized Welcome Banner

```typescript
export function WelcomeBanner() {
  const { isNewUser, isReturningUser } = usePersonalize();
  
  if (isNewUser) {
    return (
      <Banner
        headline="Welcome to MangaFan!"
        subtext="Start your manga journey"
        cta="Explore Popular Manga"
      />
    );
  }
  
  if (isReturningUser) {
    return (
      <Banner
        headline="Welcome back!"
        subtext="Continue your reading adventure"
        cta="Continue Reading"
      />
    );
  }
  
  return null;
}
```

---

## 10. Demo Script

### Demo Flow for Presentation

#### Part 1: Contentstack CMS (2-3 minutes)

1. **Open Contentstack Dashboard**
   - Show Stack with content types: Manga, Manga List, Author
   - Show content entries with images, references, taxonomies

2. **Show Content Model**
   - Manga content type with fields
   - Taxonomy setup (Genre, Status)
   - Reference fields linking Author to Manga

3. **Demonstrate Content Creation**
   - Quick walkthrough of adding a new manga entry
   - Show how taxonomies are selected
   - Publish the entry

#### Part 2: Live Application (3-4 minutes)

1. **Homepage**
   - Show manga grid fetched from Contentstack
   - Point out CDN-served images

2. **Genre Filtering**
   - Filter by Action, Fantasy, etc.
   - Explain taxonomy-based filtering

3. **Manga Detail Page**
   - Show content rendered from CMS
   - Highlight "Similar Manga" section (taxonomy-based)

4. **Chapter Reader**
   - Open a chapter
   - Show pages served from Contentstack Assets CDN

#### Part 3: Personalization Demo (2-3 minutes)

1. **New User Experience**
   - Open incognito/clear localStorage
   - Show "Welcome to MangaFan!" banner

2. **Build User Profile**
   - Visit several Action manga
   - Show genre preferences being tracked (DevTools → localStorage)

3. **Returning User Experience**
   - Refresh page
   - Show personalized recommendations
   - Show "Welcome back!" banner

#### Part 4: Webhooks Demo (1-2 minutes)

1. **Publish New Chapter in CMS**
   - Go to Contentstack
   - Publish a chapter entry

2. **Show Webhook Trigger**
   - (Optional) Show server logs or webhook response
   - Explain notification flow to subscribers

---

## 11. Technical Implementation Details

### Environment Variables Required

```env
# Contentstack Delivery API
NEXT_PUBLIC_CONTENTSTACK_API_KEY=your_api_key
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=production
NEXT_PUBLIC_CONTENTSTACK_REGION=us

# Contentstack CMA (optional, for admin features)
CONTENTSTACK_API_KEY=your_api_key
CONTENTSTACK_MANAGEMENT_TOKEN=your_management_token

# Contentstack Personalize
NEXT_PUBLIC_PERSONALIZE_PROJECT_UID=your_project_uid

# Webhooks
CONTENTSTACK_WEBHOOK_SECRET=your_webhook_secret
```

### NPM Dependencies

```json
{
  "dependencies": {
    "@contentstack/delivery-sdk": "^4.x",
    "@contentstack/personalize-edge-sdk": "^1.x"
  }
}
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/contentstack/client.ts` | Delivery SDK setup |
| `src/lib/contentstack/api.ts` | Content fetching methods |
| `src/lib/contentstack/cma.ts` | Management API methods |
| `src/lib/contentstack/types.ts` | TypeScript types for CS |
| `src/core/providers/personalize-provider.tsx` | Personalize SDK integration |
| `src/app/api/webhooks/contentstack/new-chapter/route.ts` | Webhook handler |
| `src/components/SimilarMangaSection.tsx` | Similar manga feature |

---

## Summary

MangaFan demonstrates a comprehensive integration with Contentstack's ecosystem:

| Component | Integration |
|-----------|-------------|
| **Content Storage** | Contentstack CMS (Headless) |
| **Content Delivery** | Delivery SDK + CDN |
| **Content Management** | CMA for server-side operations |
| **Personalization** | Personalize Edge SDK |
| **Automation** | Webhooks via Automate |
| **Categorization** | Taxonomies (Genre, Status) |
| **Asset Management** | Contentstack Assets CDN |

This architecture provides:
- ✅ **Scalability** - CDN-backed content delivery
- ✅ **Flexibility** - Headless CMS for any frontend
- ✅ **Personalization** - Real-time, edge-based
- ✅ **Automation** - Event-driven workflows
- ✅ **Developer Experience** - Strong SDKs and TypeScript support

---

## Resources

- [Contentstack Documentation](https://www.contentstack.com/docs/)
- [Delivery SDK Reference](https://www.contentstack.com/docs/developers/sdks/content-delivery-sdk/javascript-browser)
- [Personalize Edge SDK](https://www.contentstack.com/docs/developers/sdks/personalize-edge-sdk/javascript)
- [CMA Reference](https://www.contentstack.com/docs/developers/apis/content-management-api/)
- [Automate/Webhooks](https://www.contentstack.com/docs/developers/set-up-webhooks/)

---

*Document prepared for NotebookLM presentation generation*
