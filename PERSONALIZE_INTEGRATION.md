# Contentstack Personalize Integration Guide for MangaFan

## ✅ Setup Status

**CMS Setup - COMPLETED:**
- ✅ `personalized_banner` content type created
- ✅ `personalized_hero` content type created  
- ✅ `personalized_manga_list` content type created
- ✅ Welcome banners for new/returning users created & published
- ✅ Personalized hero content created & published
- ✅ Personalized manga lists created & published

**Code Setup - COMPLETED:**
- ✅ Genre tracking via `PersonalizeProvider` with weighted scoring
- ✅ `getSimilarManga()` API method using taxonomy queries
- ✅ `SimilarMangaSection` component ("You Would Also Like")
- ✅ `getRecommendedManga()` API method for weighted recommendations
- ✅ Genre preference hooks (`useGenrePreferences`, `useGenreBasedVariant`)

**Remaining Step - Create Personalize Project:**
See **Quick Start** section below.

---

## Quick Start: Create Personalize Project

Since CMS content types and entries are already created, you just need to:

### Step 1: Create Project (1 min)
1. Go to https://app.contentstack.com
2. Click **App Switcher** (⊞ grid icon) → Select **"Personalize"**
3. Click **"+ New Project"**
4. Name: `MangaFan`
5. Click **Create**

### Step 2: Get Your Project UID (30 sec)
1. In your new project, click **Settings** (⚙️) → **General**
2. Copy the **Project UID** (24 chars, like `bltxxxxxxxxxxxxxxxx`)

### Step 3: Add to Environment (30 sec)
Add to your `.env.local`:
```env
NEXT_PUBLIC_PERSONALIZE_PROJECT_UID=your_project_uid_here
```

### Step 4: Create Audiences
In Personalize dashboard → **Audiences** → **+ Create Audience**:

**Basic Audiences:**

| Audience Name | Short ID | Condition |
|--------------|----------|-----------|
| New Users | `new_users` | `session_count` equals `1` |
| Returning Users | `returning_users` | `session_count` greater than `1` |

**Genre-Based Audiences (using custom attributes from code):**

| Audience Name | Short ID | Condition |
|--------------|----------|-----------|
| Action Readers | `action_readers` | Custom attribute `has_read_action` equals `true` |
| Adventure Readers | `adventure_readers` | Custom attribute `has_read_adventure` equals `true` |
| Fantasy Readers | `fantasy_readers` | Custom attribute `has_read_fantasy` equals `true` |
| Martial Arts Readers | `martial_arts_readers` | Custom attribute `has_read_martial_arts` equals `true` |
| Comedy Readers | `comedy_readers` | Custom attribute `has_read_comedy` equals `true` |
| Romance Readers | `romance_readers` | Custom attribute `has_read_romance` equals `true` |
| Supernatural Readers | `supernatural_readers` | Custom attribute `has_read_supernatural` equals `true` |
| Horror Readers | `horror_readers` | Custom attribute `has_read_horror` equals `true` |
| Mystery Readers | `mystery_readers` | Custom attribute `has_read_mystery` equals `true` |
| Slice of Life Readers | `slice_of_life_readers` | Custom attribute `has_read_slice_of_life` equals `true` |
| Shonen Readers | `shonen_readers` | Custom attribute `has_read_shonen` equals `true` |
| Reincarnation Readers | `reincarnation_readers` | Custom attribute `has_read_reincarnation` equals `true` |
| Magic Readers | `magic_readers` | Custom attribute `has_read_magic` equals `true` |

### Step 5: Create Experiences
In Personalize dashboard → **Experiences** → **+ Create Experience**:

**Experience 1: Welcome Banner**
- Short ID: `welcome_exp`
- Variants:
  - `new_user` → Target: "New Users" audience
  - `returning_user` → Target: "Returning Users" audience

**Experience 2: Homepage Hero**
- Short ID: `homepage_hero`
- Variants:
  - `action_fans` → Target: "Action Readers" audience
  - `adventure_fans` → Target: "Adventure Readers" audience
  - `fantasy_fans` → Target: "Fantasy Readers" audience
  - `new_users` → Target: "New Users" audience (default)

**Experience 3: Recommendations**
- Short ID: `recommendations`
- Variants:
  - `action_readers` → Target: "Action Readers" audience
  - `adventure_readers` → Target: "Adventure Readers" audience
  - `fantasy_readers` → Target: "Fantasy Readers" audience
  - `new_users` → Target: "New Users" audience (default)

**That's it!** The CMS content entries are already tagged with these experience/variant IDs.

---

## New Feature: Similar Manga ("You Would Also Like")

### How It Works

The app now tracks user genre preferences and shows similar manga on detail pages:

```
User visits Solo Leveling (Action, Adventure, Fantasy, Shonen)
         │
         ▼
trackMangaRead() called with genres
         │
         ├─► genrePreferences Set updated (action, adventure, fantasy, shonen)
         │
         ├─► genreWeights Map updated (action: 1, adventure: 1, etc.)
         │
         └─► Personalize SDK attributes set (has_read_action: true, etc.)
         
On Manga Detail Page:
         │
         ▼
SimilarMangaSection component
         │
         ├─► Calls getSimilarManga(genres, currentMangaId)
         │
         ├─► Contentstack API queries manga with matching genre taxonomies
         │
         ├─► Results scored by genre overlap count
         │
         └─► Displays "You Would Also Like" grid
```

### Key Components

| Component/Hook | Location | Purpose |
|---------------|----------|---------|
| `SimilarMangaSection` | `src/components/SimilarMangaSection.tsx` | UI for similar manga |
| `getSimilarManga()` | `src/lib/contentstack/api.ts` | API to fetch by genre taxonomy |
| `getRecommendedManga()` | `src/lib/contentstack/api.ts` | Weighted recommendations |
| `useGenrePreferences()` | `src/core/providers/personalize-provider.tsx` | Access genre weights |
| `useGenreBasedVariant()` | `src/core/providers/personalize-provider.tsx` | Get variant ID from favorite genre |

### Data Storage

**localStorage keys:**
- `mangafan_genre_preferences` - Array of genre strings (e.g., `["action", "adventure"]`)
- `mangafan_genre_weights` - Object of genre -> count (e.g., `{"action": 3, "adventure": 2}`)
- `mangafan_returning_user` - Boolean flag for returning users

### Custom Attributes Sent to Personalize

The app automatically sets these boolean attributes based on user reading:

```typescript
has_read_action: boolean
has_read_adventure: boolean
has_read_fantasy: boolean
has_read_martial_arts: boolean
has_read_comedy: boolean
has_read_romance: boolean
has_read_supernatural: boolean
has_read_horror: boolean
has_read_mystery: boolean
has_read_slice_of_life: boolean
has_read_shonen: boolean
has_read_reincarnation: boolean
has_read_magic: boolean
```

---

## Overview

Contentstack Personalize is an edge-optimized personalization engine that enables real-time, data-driven content delivery. This guide explains how to integrate Personalize into MangaFan for:

1. **User Behavior Tracking** - Personalize content based on reading history and preferences
2. **New vs Returning User Greetings** - Show tailored welcome messages
3. **CMS-Driven Personalized Content** - Fetch dynamic content variants from Contentstack CMS

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MangaFan Frontend                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │ Personalize      │    │ Contentstack     │    │ User Library     │      │
│  │ Provider         │◄───│ Client           │◄───│ Provider         │      │
│  │ (SDK + Variants) │    │ (CMS Content)    │    │ (Reading Data)   │      │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘      │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Components                                   │   │
│  │  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │   │
│  │  │ Welcome      │  │ Personalized   │  │ Hero Section            │  │   │
│  │  │ Banner (CMS) │  │ Recommendations│  │ (CMS Variants)          │  │   │
│  │  └──────────────┘  └────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐  ┌──────────────────────────────────────────┐
│  Contentstack Personalize     │  │        Contentstack CMS                   │
├───────────────────────────────┤  ├──────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐  │  │  ┌─────────────────────────────────────┐ │
│  │ Audiences │ │Experiences│  │  │  │ Content Types                       │ │
│  │           │ │           │  │  │  │                                     │ │
│  │• new_users│ │• welcome  │  │  │  │ • Personalized Banner               │ │
│  │• returning│ │• hero     │  │  │  │ • Personalized Hero                 │ │
│  │• action   │ │• recommend│  │  │  │ • Personalized Manga List           │ │
│  └───────────┘ └───────────┘  │  │  └─────────────────────────────────────┘ │
│                               │  │                                          │
│  ┌─────────────────────────┐  │  │  ┌─────────────────────────────────────┐ │
│  │ Edge API                │  │  │  │ Entries (with Variants)             │ │
│  │ • Set attributes        │  │  │  │                                     │ │
│  │ • Get active variants   │◄─┼──┼──│ • Welcome Banner (new user variant) │ │
│  │ • Track events          │  │  │  │ • Welcome Banner (returning variant)│ │
│  └─────────────────────────┘  │  │  │ • Hero Content (action variant)     │ │
└───────────────────────────────┘  │  │ • Hero Content (romance variant)    │ │
                                   │  └─────────────────────────────────────┘ │
                                   └──────────────────────────────────────────┘
```

---

## Part 1: Create a Personalize Project in Contentstack

### Step 1: Access Personalize

1. Log into your Contentstack account at https://app.contentstack.com
2. Click the **App Switcher** (grid icon) in the top-left corner
3. Select **Personalize** from the dropdown

> **Note:** If you don't see Personalize, contact Contentstack support to enable it for your organization.

### Step 2: Create a New Project

1. Click **"+ New Project"** button
2. Enter project details:
   - **Name:** `MangaFan Personalization`
   - **Description:** `Personalized experiences for MangaFan manga reader`
3. Click **Create**

### Step 3: Link to Your Stack

1. In your new Personalize project, go to **Settings** → **Integrations**
2. Click **"Connect Stack"**
3. Select your MangaFan stack from the dropdown
4. Click **Connect**

### Step 4: Copy Your Project UID

1. Go to **Settings** → **General**
2. Copy the **Project UID** (you'll need this for your `.env.local`)

---

## Part 2: Set Up Content Types in CMS

Create content types in Contentstack CMS to store personalized content variants.

### Content Type 1: Personalized Banner

**UID:** `personalized_banner`

| Field Name | Field Type | UID | Description |
|------------|------------|-----|-------------|
| Title | Single Line | `title` | Internal title |
| Experience ID | Single Line | `experience_id` | Links to Personalize experience |
| Variant ID | Single Line | `variant_id` | Links to Personalize variant |
| Headline | Single Line | `headline` | Banner headline text |
| Headline Japanese | Single Line | `headline_jp` | Japanese headline |
| Subtext | Multi Line | `subtext` | Supporting text |
| CTA Text | Single Line | `cta_text` | Button text |
| CTA Link | Single Line | `cta_link` | Button URL |
| Icon | Single Line | `icon` | Icon name (e.g., "sparkles", "book") |
| Gradient | Single Line | `gradient` | CSS gradient classes |
| Priority | Number | `priority` | Display order |

### Content Type 2: Personalized Hero

**UID:** `personalized_hero`

| Field Name | Field Type | UID | Description |
|------------|------------|-----|-------------|
| Title | Single Line | `title` | Internal title |
| Experience ID | Single Line | `experience_id` | Links to Personalize experience |
| Variant ID | Single Line | `variant_id` | Links to Personalize variant |
| Featured Manga | Reference | `featured_manga` | Reference to Manga content type |
| Badge Text | Single Line | `badge_text` | Badge label |
| Badge Text Japanese | Single Line | `badge_text_jp` | Japanese badge |
| Override Synopsis | Multi Line | `override_synopsis` | Custom synopsis (optional) |

### Content Type 3: Personalized Manga List

**UID:** `personalized_manga_list`

| Field Name | Field Type | UID | Description |
|------------|------------|-----|-------------|
| Title | Single Line | `title` | Section title |
| Experience ID | Single Line | `experience_id` | Links to Personalize experience |
| Variant ID | Single Line | `variant_id` | Links to Personalize variant |
| Section Subtitle | Single Line | `subtitle` | Japanese subtitle |
| Manga Items | Reference (Multiple) | `manga_items` | List of manga to show |
| Display Reason | Single Line | `display_reason` | "Because you love Action" |

---

## Part 3: Create Audiences in Personalize

In Contentstack Personalize dashboard, create these audiences:

### Audience 1: New Users
- **Name:** `new_users`
- **Description:** First-time visitors
- **Conditions:** 
  - Attribute `isNewUser` equals `true`

### Audience 2: Returning Users
- **Name:** `returning_users`
- **Description:** Users who have visited before
- **Conditions:**
  - Attribute `isNewUser` equals `false`

### Audience 3: Action Manga Readers
- **Name:** `action_readers`
- **Description:** Users who frequently read Action manga
- **Conditions:**
  - Attribute `favoriteGenre` equals `Action`

### Audience 4: Romance Manga Readers
- **Name:** `romance_readers`
- **Description:** Users who frequently read Romance manga
- **Conditions:**
  - Attribute `favoriteGenre` equals `Romance`

### Audience 5: Heavy Readers
- **Name:** `heavy_readers`
- **Description:** Power users who read a lot
- **Conditions:**
  - Attribute `chaptersRead` greater than or equal to `50`

---

## Part 4: Create Experiences in Personalize

### Experience 1: Welcome Banner

**Name:** `welcome_banner`  
**Short ID:** `welcome_banner`

| Variant | Audience | Description |
|---------|----------|-------------|
| `new_user_welcome` | `new_users` | Welcome message for first-time visitors |
| `returning_user_welcome` | `returning_users` | Welcome back message |
| `default` | Everyone (fallback) | Generic welcome |

### Experience 2: Homepage Hero

**Name:** `homepage_hero`  
**Short ID:** `homepage_hero`

| Variant | Audience | Description |
|---------|----------|-------------|
| `action_hero` | `action_readers` | Feature action manga |
| `romance_hero` | `romance_readers` | Feature romance manga |
| `default` | Everyone (fallback) | Feature trending manga |

### Experience 3: Recommendations Section

**Name:** `recommendations`  
**Short ID:** `recommendations`

| Variant | Audience | Description |
|---------|----------|-------------|
| `action_recommendations` | `action_readers` | Action manga list |
| `romance_recommendations` | `romance_readers` | Romance manga list |
| `popular_recommendations` | `new_users` | Popular for newcomers |
| `default` | Everyone | Recently updated |

---

## Part 5: Create Content Entries in CMS

### Welcome Banner Entries

Create entries in the `personalized_banner` content type:

**Entry 1: New User Welcome**
```json
{
  "title": "New User Welcome Banner",
  "experience_id": "welcome_banner",
  "variant_id": "new_user_welcome",
  "headline": "Welcome to MangaFan!",
  "headline_jp": "ようこそ!",
  "subtext": "Start your manga journey with these popular titles",
  "cta_text": "Explore Popular Manga",
  "cta_link": "/discover",
  "icon": "sparkles",
  "gradient": "from-vermillion-500/20 via-sakura-500/10 to-transparent",
  "priority": 1
}
```

**Entry 2: Returning User Welcome**
```json
{
  "title": "Returning User Welcome Banner",
  "experience_id": "welcome_banner",
  "variant_id": "returning_user_welcome",
  "headline": "Welcome back!",
  "headline_jp": "お帰りなさい!",
  "subtext": "Continue your reading adventure",
  "cta_text": "Continue Reading",
  "cta_link": "/library",
  "icon": "book-open",
  "gradient": "from-kiniro-400/20 via-ai-500/10 to-transparent",
  "priority": 1
}
```

---

## Part 6: Implementation Code

### Install Dependencies

```bash
npm install @contentstack/personalize-edge-sdk @contentstack/delivery-sdk
```

### Environment Variables

Add to `.env.local`:

```env
# Contentstack CMS
NEXT_PUBLIC_CONTENTSTACK_API_KEY=your_api_key
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=your_environment

# Contentstack Personalize
NEXT_PUBLIC_PERSONALIZE_PROJECT_UID=your_personalize_project_uid
```

### File Structure

```
src/
├── lib/
│   ├── contentstack/
│   │   ├── client.ts              # CMS client setup
│   │   ├── queries.ts             # Content queries
│   │   └── types.ts               # CMS content types
│   └── personalize/
│       ├── types.ts               # Personalize types
│       ├── attributes.ts          # User attribute calculator
│       └── config.ts              # SDK configuration
├── core/
│   └── providers/
│       ├── personalize-provider.tsx  # Main provider
│       └── index.tsx                 # Export provider
├── shared/
│   └── components/
│       └── personalized-banner.tsx   # CMS-driven banner
├── features/
│   └── manga/
│       └── hooks/
│           └── use-personalized-content.ts  # Fetch CMS content
└── app/
    └── page.tsx                      # Use personalized components
```

### Contentstack Client (`src/lib/contentstack/client.ts`)

```typescript
import Contentstack from '@contentstack/delivery-sdk';

const stack = Contentstack.stack({
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!,
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!,
});

export default stack;
```

### CMS Types (`src/lib/contentstack/types.ts`)

```typescript
export interface PersonalizedBannerEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  headline: string;
  headline_jp?: string;
  subtext: string;
  cta_text: string;
  cta_link: string;
  icon: string;
  gradient: string;
  priority: number;
}

export interface PersonalizedHeroEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  featured_manga: {
    uid: string;
    title: string;
    // ... other manga fields
  }[];
  badge_text: string;
  badge_text_jp?: string;
  override_synopsis?: string;
}

export interface PersonalizedMangaListEntry {
  uid: string;
  title: string;
  experience_id: string;
  variant_id: string;
  subtitle?: string;
  manga_items: {
    uid: string;
    title: string;
    // ... other manga fields
  }[];
  display_reason: string;
}
```

### CMS Queries (`src/lib/contentstack/queries.ts`)

```typescript
import stack from './client';
import type { 
  PersonalizedBannerEntry, 
  PersonalizedHeroEntry,
  PersonalizedMangaListEntry 
} from './types';

/**
 * Fetch personalized banner content by variant ID
 */
export async function getPersonalizedBanner(
  variantId: string
): Promise<PersonalizedBannerEntry | null> {
  try {
    const query = stack
      .contentType('personalized_banner')
      .entry()
      .query()
      .where('variant_id', variantId);
    
    const result = await query.find();
    
    if (result.entries && result.entries.length > 0) {
      return result.entries[0] as PersonalizedBannerEntry;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch personalized banner:', error);
    return null;
  }
}

/**
 * Fetch personalized hero content by variant ID
 */
export async function getPersonalizedHero(
  variantId: string
): Promise<PersonalizedHeroEntry | null> {
  try {
    const query = stack
      .contentType('personalized_hero')
      .entry()
      .query()
      .where('variant_id', variantId)
      .includeReference('featured_manga');
    
    const result = await query.find();
    
    if (result.entries && result.entries.length > 0) {
      return result.entries[0] as PersonalizedHeroEntry;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch personalized hero:', error);
    return null;
  }
}

/**
 * Fetch personalized manga list by variant ID
 */
export async function getPersonalizedMangaList(
  variantId: string
): Promise<PersonalizedMangaListEntry | null> {
  try {
    const query = stack
      .contentType('personalized_manga_list')
      .entry()
      .query()
      .where('variant_id', variantId)
      .includeReference('manga_items');
    
    const result = await query.find();
    
    if (result.entries && result.entries.length > 0) {
      return result.entries[0] as PersonalizedMangaListEntry;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch personalized manga list:', error);
    return null;
  }
}

/**
 * Fetch default/fallback banner
 */
export async function getDefaultBanner(): Promise<PersonalizedBannerEntry | null> {
  return getPersonalizedBanner('default');
}
```

### Personalize Types (`src/lib/personalize/types.ts`)

```typescript
export interface UserAttributes {
  isNewUser: boolean;
  visitCount: number;
  favoriteGenre: string | null;
  chaptersRead: number;
  bookmarkCount: number;
  lastVisit: string | null;
}

export interface ActiveVariant {
  experienceShortId: string;
  variantShortId: string;
}

export interface PersonalizeContextValue {
  isInitialized: boolean;
  userAttributes: UserAttributes;
  activeVariants: Record<string, string>; // experienceId -> variantId
  getVariantForExperience: (experienceShortId: string) => string | null;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackImpression: (experienceShortId: string, variantShortId: string) => void;
}
```

### Personalize Provider (`src/core/providers/personalize-provider.tsx`)

```typescript
"use client";

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  ReactNode 
} from 'react';
import Personalize from '@contentstack/personalize-edge-sdk';
import { useUserLibrary } from './user-library-provider';
import type { 
  UserAttributes, 
  PersonalizeContextValue 
} from '@/lib/personalize/types';

const PersonalizeContext = createContext<PersonalizeContextValue | null>(null);

const PROJECT_UID = process.env.NEXT_PUBLIC_PERSONALIZE_PROJECT_UID || '';

// Helper functions
function isNewUser(): boolean {
  if (typeof window === 'undefined') return true;
  return !localStorage.getItem('mangafan_visited');
}

function markUserAsReturning(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mangafan_visited', 'true');
}

function getVisitCount(): number {
  if (typeof window === 'undefined') return 1;
  const count = parseInt(localStorage.getItem('mangafan_visit_count') || '0', 10);
  return count;
}

function incrementVisitCount(): void {
  if (typeof window === 'undefined') return;
  const count = getVisitCount() + 1;
  localStorage.setItem('mangafan_visit_count', count.toString());
}

function calculateFavoriteGenre(
  history: Array<{ mangaSlug: string }>,
  mangaGenres: Record<string, string[]> // slug -> genres mapping
): string | null {
  const genreCount: Record<string, number> = {};
  
  history.forEach(item => {
    const genres = mangaGenres[item.mangaSlug] || [];
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });
  
  const sorted = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
}

function calculateChaptersRead(
  progress: Record<string, { lastChapterNumber: number }>
): number {
  return Object.values(progress).reduce(
    (total, p) => total + p.lastChapterNumber,
    0
  );
}

export function PersonalizeProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeVariants, setActiveVariants] = useState<Record<string, string>>({});
  const [userAttributes, setUserAttributes] = useState<UserAttributes>({
    isNewUser: true,
    visitCount: 1,
    favoriteGenre: null,
    chaptersRead: 0,
    bookmarkCount: 0,
    lastVisit: null,
  });

  const { readingProgress, history, bookmarked, isLoaded } = useUserLibrary();

  // Initialize Personalize SDK
  useEffect(() => {
    if (!PROJECT_UID) {
      console.warn('Personalize Project UID not configured');
      return;
    }

    const initPersonalize = async () => {
      try {
        await Personalize.init(PROJECT_UID);
        setIsInitialized(true);
        
        // Mark user visit
        incrementVisitCount();
        
        // Get all active experiences/variants
        const experiences = Personalize.getExperiences();
        const variants: Record<string, string> = {};
        
        experiences.forEach((exp: any) => {
          if (exp.variantShortId) {
            variants[exp.experienceShortId] = exp.variantShortId;
          }
        });
        
        setActiveVariants(variants);
        
        // Mark as returning after first load
        markUserAsReturning();
      } catch (error) {
        console.error('Failed to initialize Personalize:', error);
      }
    };

    initPersonalize();
  }, []);

  // Update attributes when user library loads
  useEffect(() => {
    if (!isLoaded) return;

    // Note: You'd need a way to get manga genres - this is simplified
    const mangaGenres: Record<string, string[]> = {}; // Populate from your data
    
    const newAttributes: UserAttributes = {
      isNewUser: isNewUser(),
      visitCount: getVisitCount(),
      favoriteGenre: calculateFavoriteGenre(history, mangaGenres),
      chaptersRead: calculateChaptersRead(readingProgress),
      bookmarkCount: Object.keys(bookmarked).length,
      lastVisit: new Date().toISOString(),
    };

    setUserAttributes(newAttributes);

    // Send attributes to Personalize
    if (isInitialized) {
      Personalize.set(newAttributes);
    }
  }, [isLoaded, readingProgress, history, bookmarked, isInitialized]);

  const getVariantForExperience = useCallback((experienceShortId: string): string | null => {
    return activeVariants[experienceShortId] || null;
  }, [activeVariants]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!isInitialized) return;
    
    try {
      Personalize.triggerEvent(eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [isInitialized]);

  const trackImpression = useCallback((experienceShortId: string, variantShortId: string) => {
    if (!isInitialized) return;
    
    try {
      Personalize.triggerEvent('cs:impression', {
        experienceShortId,
        variantShortId,
      });
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  }, [isInitialized]);

  return (
    <PersonalizeContext.Provider
      value={{
        isInitialized,
        userAttributes,
        activeVariants,
        getVariantForExperience,
        trackEvent,
        trackImpression,
      }}
    >
      {children}
    </PersonalizeContext.Provider>
  );
}

export function usePersonalize() {
  const context = useContext(PersonalizeContext);
  if (!context) {
    return {
      isInitialized: false,
      userAttributes: {
        isNewUser: true,
        visitCount: 1,
        favoriteGenre: null,
        chaptersRead: 0,
        bookmarkCount: 0,
        lastVisit: null,
      },
      activeVariants: {},
      getVariantForExperience: () => null,
      trackEvent: () => {},
      trackImpression: () => {},
    };
  }
  return context;
}
```

### Hook: Fetch Personalized Content (`src/features/manga/hooks/use-personalized-content.ts`)

```typescript
import { useEffect, useState } from 'react';
import { usePersonalize } from '@/core/providers/personalize-provider';
import { 
  getPersonalizedBanner, 
  getPersonalizedHero,
  getPersonalizedMangaList,
  getDefaultBanner 
} from '@/lib/contentstack/queries';
import type { 
  PersonalizedBannerEntry,
  PersonalizedHeroEntry,
  PersonalizedMangaListEntry 
} from '@/lib/contentstack/types';

/**
 * Hook to fetch personalized banner from CMS
 */
export function usePersonalizedBanner() {
  const { getVariantForExperience, isInitialized, trackImpression } = usePersonalize();
  const [banner, setBanner] = useState<PersonalizedBannerEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      setIsLoading(true);
      
      // Get variant from Personalize
      const variantId = getVariantForExperience('welcome_banner');
      
      let content: PersonalizedBannerEntry | null = null;
      
      if (variantId) {
        // Fetch content for this variant from CMS
        content = await getPersonalizedBanner(variantId);
        
        // Track impression
        if (content) {
          trackImpression('welcome_banner', variantId);
        }
      }
      
      // Fallback to default if no variant content found
      if (!content) {
        content = await getDefaultBanner();
      }
      
      setBanner(content);
      setIsLoading(false);
    };

    // Wait for Personalize to initialize, or fetch default after timeout
    if (isInitialized) {
      fetchBanner();
    } else {
      // Timeout fallback for SSR or slow init
      const timeout = setTimeout(() => {
        fetchBanner();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [isInitialized, getVariantForExperience, trackImpression]);

  return { banner, isLoading };
}

/**
 * Hook to fetch personalized hero from CMS
 */
export function usePersonalizedHero() {
  const { getVariantForExperience, isInitialized, trackImpression } = usePersonalize();
  const [hero, setHero] = useState<PersonalizedHeroEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      setIsLoading(true);
      
      const variantId = getVariantForExperience('homepage_hero');
      
      let content: PersonalizedHeroEntry | null = null;
      
      if (variantId) {
        content = await getPersonalizedHero(variantId);
        
        if (content) {
          trackImpression('homepage_hero', variantId);
        }
      }
      
      setHero(content);
      setIsLoading(false);
    };

    if (isInitialized) {
      fetchHero();
    } else {
      const timeout = setTimeout(() => {
        fetchHero();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [isInitialized, getVariantForExperience, trackImpression]);

  return { hero, isLoading };
}

/**
 * Hook to fetch personalized recommendations from CMS
 */
export function usePersonalizedRecommendations() {
  const { getVariantForExperience, isInitialized, trackImpression } = usePersonalize();
  const [recommendations, setRecommendations] = useState<PersonalizedMangaListEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      const variantId = getVariantForExperience('recommendations');
      
      let content: PersonalizedMangaListEntry | null = null;
      
      if (variantId) {
        content = await getPersonalizedMangaList(variantId);
        
        if (content) {
          trackImpression('recommendations', variantId);
        }
      }
      
      setRecommendations(content);
      setIsLoading(false);
    };

    if (isInitialized) {
      fetchRecommendations();
    } else {
      const timeout = setTimeout(() => {
        fetchRecommendations();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [isInitialized, getVariantForExperience, trackImpression]);

  return { recommendations, isLoading };
}
```

### Personalized Banner Component (`src/shared/components/personalized-banner.tsx`)

```typescript
"use client";

import { useState } from 'react';
import { Sparkles, BookOpen, Zap, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePersonalizedBanner } from '@/features/manga/hooks/use-personalized-content';
import { Skeleton } from '@/shared/components/ui';

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
};

export function PersonalizedBanner() {
  const { banner, isLoading } = usePersonalizedBanner();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  if (isLoading) {
    return <Skeleton className="h-24 rounded-2xl mb-8" />;
  }

  if (!banner) return null;

  const icon = iconMap[banner.icon] || <Sparkles className="w-6 h-6" />;

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${banner.gradient} border border-sumi-700/30 p-6 mb-8`}
    >
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-sumi-500 hover:text-sumi-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-sumi-800/50 border border-sumi-700/50 flex items-center justify-center text-vermillion-400">
          {icon}
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold text-sumi-50">
            {banner.headline_jp && (
              <span className="text-kiniro-400 mr-2">{banner.headline_jp}</span>
            )}
            {banner.headline}
          </h2>
          <p className="text-sm text-sumi-400">{banner.subtext}</p>
        </div>

        <Link
          href={banner.cta_link}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 btn-jp text-white rounded-full text-sm font-medium"
        >
          {banner.cta_text}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
```

### Update Home Page (`src/app/page.tsx`)

```typescript
"use client";

import { PersonalizedBanner } from '@/shared/components/personalized-banner';
import { usePersonalizedRecommendations } from '@/features/manga/hooks/use-personalized-content';
// ... other imports

export default function HomePage() {
  const { recommendations, isLoading: recsLoading } = usePersonalizedRecommendations();
  // ... other hooks

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* CMS-Driven Personalized Banner */}
        <PersonalizedBanner />

        {/* Hero Section */}
        {/* ... existing hero code ... */}

        {/* CMS-Driven Personalized Recommendations */}
        {recommendations && recommendations.manga_items.length > 0 && (
          <SectionRow
            title="Recommended for You"
            subtitle={recommendations.display_reason}
            items={recommendations.manga_items}
            icon={Sparkles}
          />
        )}

        {/* ... rest of the page ... */}
      </main>
    </>
  );
}
```

### Update Providers (`src/core/providers/index.tsx`)

```typescript
import { PersonalizeProvider } from './personalize-provider';

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BackendLibraryProvider>
          <UserLibraryProvider>
            <PersonalizeProvider>
              {children}
            </PersonalizeProvider>
          </UserLibraryProvider>
        </BackendLibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { usePersonalize } from './personalize-provider';
```

---

## Part 7: Data Flow Summary

```
1. User visits MangaFan
          │
          ▼
2. PersonalizeProvider initializes SDK with Project UID
          │
          ▼
3. SDK determines user attributes from:
   - localStorage (isNewUser, visitCount)
   - UserLibraryProvider (chaptersRead, favoriteGenre, bookmarkCount)
          │
          ▼
4. SDK sends attributes to Personalize Edge API
          │
          ▼
5. Edge API returns active variants for each experience:
   - welcome_banner → "new_user_welcome"
   - homepage_hero → "action_hero"
   - recommendations → "action_recommendations"
          │
          ▼
6. usePersonalizedBanner hook:
   a. Gets variant ID from Personalize
   b. Queries CMS for entry where variant_id matches
   c. Returns CMS content
          │
          ▼
7. PersonalizedBanner component renders CMS content
          │
          ▼
8. Track impression event back to Personalize
```

---

## Part 8: Testing Checklist

### Test New User Flow
- [ ] Clear localStorage and cookies
- [ ] Visit site in incognito mode
- [ ] Verify "new_user_welcome" banner appears
- [ ] Verify content matches CMS entry

### Test Returning User Flow
- [ ] Visit site normally (after previous visit)
- [ ] Verify "returning_user_welcome" banner appears
- [ ] Verify personalized recommendations based on reading history

### Test Genre Personalization
- [ ] Read several Action manga chapters
- [ ] Refresh page
- [ ] Verify Action-themed recommendations appear

### Test CMS Content Updates
- [ ] Update banner text in Contentstack CMS
- [ ] Publish entry
- [ ] Refresh MangaFan
- [ ] Verify new content appears

---

## Resources

- [Contentstack Personalize Docs](https://www.contentstack.com/docs/personalize/)
- [Personalize Edge SDK Reference](https://www.contentstack.com/docs/developers/sdks/personalize-edge-sdk/javascript/reference)
- [Personalize Edge API](https://www.contentstack.com/docs/developers/apis/personalize-edge-api)
- [Contentstack Delivery SDK](https://www.contentstack.com/docs/developers/sdks/content-delivery-sdk/javascript-browser)

---

## Next Steps

1. **Create Personalize Project** in Contentstack dashboard
2. **Set up Content Types** in your CMS stack
3. **Create Audiences and Experiences** in Personalize
4. **Add Content Entries** for each variant
5. **Implement the code** following this guide
6. **Test** all user scenarios
7. **Monitor analytics** in Personalize dashboard to optimize
