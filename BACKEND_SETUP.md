# MangaFan Backend Service

This document describes the backend service architecture for user management, bookmarks, ratings, views, subscriptions, and email notifications.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  AuthProvider  │  BackendLibraryProvider  │  UserLibraryProvider │
│    (Auth)      │    (Backend Sync)        │    (Local Storage)   │
└────────────────┴─────────────────────────┴──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (/api/*)                         │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  /auth/*     │  /bookmarks  │  /ratings    │  /subscriptions   │
│  /views      │  /reading-   │  /manga/     │  /webhooks/       │
│              │   progress   │   [uid]/stats│   contentstack/*  │
└──────────────┴──────────────┴──────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma ORM + SQLite                           │
│  (Users, Sessions, Bookmarks, Ratings, Subscriptions, Views)    │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. User Authentication
- **Magic Link Login**: Passwordless email authentication
- **Password Login**: Traditional email/password
- **JWT Sessions**: Secure token-based sessions
- **Guest Mode**: Full read access without login

### 2. User Interactions (Requires Login)
- **Bookmarks**: Save manga to your library
- **Ratings**: Rate manga 1-5 stars
- **Subscriptions**: Subscribe for new chapter notifications
- **Reading Progress**: Track last read chapter

### 3. Analytics (Works for Guests)
- **View Tracking**: Track manga/chapter views
- **Manga Stats**: Aggregated stats (views, ratings, bookmarks)

### 4. Email Notifications
- **New Chapter Alerts**: Email when subscribed manga gets new chapter
- **Welcome Email**: Sent on registration
- **Magic Link Email**: For passwordless login

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with password |
| POST | `/api/auth/magic-link` | Request magic link |
| GET/POST | `/api/auth/verify-magic-link` | Verify magic link |
| POST | `/api/auth/logout` | Logout |
| GET/PATCH | `/api/auth/me` | Get/update profile |

### User Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/bookmarks` | Manage bookmarks |
| GET/POST/DELETE | `/api/ratings` | Manage ratings |
| GET/POST/DELETE | `/api/subscriptions` | Manage subscriptions |
| GET/POST | `/api/reading-progress` | Track reading progress |
| GET/POST | `/api/views` | Track views (guests OK) |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manga/[uid]/stats` | Get manga statistics |

### Subscribers (API Key Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscribers?manga=<name>` | Get subscribers by manga name/slug/uid |
| POST | `/api/subscribers` | Get subscribers with body params |
| GET | `/api/manga/[uid]/subscribers` | Get subscribers by manga UID |
| POST | `/api/manga/[uid]/subscribers` | Get subscribers with search options |

### Webhooks (Contentstack Automate)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/contentstack/new-chapter` | New chapter notification |
| POST | `/api/webhooks/contentstack/sync-stats` | Sync manga stats |

## Database Schema

### Users & Auth
- `User`: User accounts
- `Session`: Active sessions
- `MagicLink`: Passwordless login tokens

### User Interactions
- `Bookmark`: Saved manga
- `Rating`: User ratings
- `Subscription`: New chapter subscriptions
- `ReadingProgress`: Reading progress tracking

### Analytics
- `ViewHistory`: Individual view records
- `MangaStats`: Aggregated manga statistics
- `NotificationLog`: Email notification history

## Setup Instructions

### 1. Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Magic Link
MAGIC_LINK_EXPIRES_MINUTES=15
MAGIC_LINK_BASE_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@mangafan.com"
SMTP_FROM_NAME="MangaFan"

# Contentstack Webhook
CONTENTSTACK_WEBHOOK_SECRET="your-webhook-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database (optional)
npx prisma studio
```

### 3. Contentstack Automate Setup

To enable new chapter notifications:

1. Go to Contentstack → Automate
2. Create new automation
3. Trigger: "Entry Published" on `manga_list` content type
4. Action: Webhook to `https://your-domain.com/api/webhooks/contentstack/new-chapter`
5. Set `x-contentstack-signature` header with your webhook secret

## Frontend Integration

### Using Auth

```tsx
import { useAuth } from '@/core/providers';

function MyComponent() {
  const { 
    isAuthenticated, 
    user, 
    login, 
    logout, 
    requestMagicLink 
  } = useAuth();

  // Check auth
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

### Using Backend Library

```tsx
import { useBackendLibrary } from '@/core/providers';

function MangaActions({ manga }) {
  const { 
    isBookmarked, 
    addBookmark, 
    removeBookmark,
    isSubscribed,
    subscribe,
    unsubscribe 
  } = useBackendLibrary();

  const bookmarked = isBookmarked(manga.uid);
  const subscribed = isSubscribed(manga.uid);

  return (
    <div>
      <button onClick={() => 
        bookmarked 
          ? removeBookmark(manga.uid) 
          : addBookmark({ mangaUid: manga.uid, mangaSlug: manga.slug, mangaTitle: manga.title })
      }>
        {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
      </button>
      
      <button onClick={() => 
        subscribed 
          ? unsubscribe(manga.uid) 
          : subscribe({ mangaUid: manga.uid, mangaSlug: manga.slug, mangaTitle: manga.title })
      }>
        {subscribed ? 'Unsubscribe' : 'Subscribe for Updates'}
      </button>
    </div>
  );
}
```

## User Flow

### Guest User
1. Can browse and read all manga freely
2. Views are tracked anonymously with guest session
3. Can use local storage for bookmarks (not synced)
4. When clicking "Follow Updates" → redirected to login page
5. After login, automatically redirected back to manga page

### Authenticated User
1. Login via magic link or password
2. Credentials stored in encrypted session storage (AES-GCM)
3. Bookmark manga → saved to database (synced across devices)
4. Subscribe to manga → enable email notifications
5. Enable "Email Updates" in profile settings
6. When subscribed manga gets new chapter → receive email notification

### Follow Updates Flow
1. Guest clicks "Follow Updates" on manga page
2. System stores current URL in session storage
3. User redirected to login page with context message
4. User logs in (magic link or password)
5. After successful login, redirected back to manga page
6. User info + manga association stored in backend
7. User receives email when new chapters are published

## Security Features

### Encrypted Session Storage
- Auth tokens are encrypted using AES-GCM before storing in session storage
- Encryption key is derived from browser fingerprint using PBKDF2
- Provides protection against XSS attacks reading raw tokens
- Falls back to base64 encoding if Web Crypto API unavailable

### Session Management
- JWT tokens with configurable expiry (default 7 days)
- Tokens stored in encrypted session storage (cleared on browser close)
- Guest sessions tracked via localStorage (persistent)

## Subscribers API

The subscribers API allows you to get a list of user emails subscribed to a specific manga. This is useful for Contentstack Automate or external notification systems.

### Authentication
All subscriber endpoints require an API key in the `x-api-key` header:
```bash
curl -H "x-api-key: your-api-secret" https://your-domain.com/api/subscribers?manga=solo-leveling
```

### GET /api/subscribers

Get subscribers by manga name, slug, or UID.

**Query Parameters:**
- `manga` (required): Manga name, slug, or UID
- `exact` (optional): If "true", requires exact match on slug/uid

**Examples:**
```bash
# Search by manga name (partial match)
GET /api/subscribers?manga=Solo%20Leveling

# Search by slug (exact match)
GET /api/subscribers?manga=solo-leveling&exact=true

# Search by UID
GET /api/subscribers?manga=m1&exact=true
```

**Response:**
```json
{
  "manga": "solo-leveling",
  "mangaUid": "m1",
  "mangaSlug": "solo-leveling",
  "mangaTitle": "Solo Leveling",
  "totalSubscribers": 5,
  "subscribers": [
    {
      "email": "user@example.com",
      "name": "John Doe",
      "subscribedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST /api/subscribers

Alternative POST endpoint for complex queries.

**Request Body:**
```json
{
  "manga": "Solo Leveling",
  "exact": false
}
```

### Usage with Contentstack Automate

1. Create an automation triggered on `manga_list` publish
2. Use HTTP action to call the subscribers endpoint
3. Use the returned emails to send notifications

```javascript
// Example Automate webhook payload
{
  "url": "https://your-domain.com/api/subscribers",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "x-api-key": "{{secrets.api_key}}"
  },
  "body": {
    "manga": "{{entry.managa[0].title}}"
  }
}
```

## Production Considerations

1. **Database**: Switch from SQLite to PostgreSQL for production
2. **Email**: Use production SMTP service (SendGrid, AWS SES, etc.)
3. **JWT Secret**: Use strong, unique secret in production
4. **Webhook Security**: Always verify Contentstack signatures
5. **Rate Limiting**: Add rate limiting to API routes
6. **Caching**: Add Redis for session caching
7. **HTTPS**: Required for secure cookie transmission

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── magic-link/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── verify-magic-link/route.ts
│   │   ├── bookmarks/route.ts
│   │   ├── manga/[mangaUid]/stats/route.ts
│   │   ├── ratings/route.ts
│   │   ├── reading-progress/route.ts
│   │   ├── subscriptions/route.ts
│   │   ├── views/route.ts
│   │   └── webhooks/contentstack/
│   │       ├── new-chapter/route.ts
│   │       └── sync-stats/route.ts
│   └── login/page.tsx
├── core/providers/
│   ├── auth-provider.tsx
│   ├── backend-library-provider.tsx
│   └── index.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   ├── email.ts
│   │   ├── index.ts
│   │   ├── jwt.ts
│   │   ├── service.ts
│   │   └── types.ts
│   └── db/
│       └── index.ts
└── prisma/
    ├── schema.prisma
    └── migrations/
```

