# 🎌 MangaFan

A modern, feature-rich manga reading platform built with Next.js 14, featuring personalized content delivery through Contentstack CMS and a beautiful Japanese-inspired aesthetic.

![MangaFan Banner](https://placehold.co/1200x400/1a1a2e/FFFFFF?text=MangaFan+-+Your+Manga+Reading+Destination)

> 🔗 **[Live Demo: manafan.contentstackapps.com](https://manafan.contentstackapps.com/)**

## ✨ Features

### 📚 Core Reading Experience
- **Dual Reading Modes** - Webtoon (vertical scroll) and Page-by-page modes
- **Auto-scroll** - Hands-free reading in webtoon mode
- **Image Preloading** - Smart preloading for seamless page transitions
- **Network-aware Quality** - Automatic image quality adjustment based on connection speed
- **Fullscreen Mode** - Immersive reading experience
- **Keyboard Navigation** - Arrow keys and shortcuts for power users

### 👤 User Management
- **Flexible Authentication** - Email/password login, magic link (passwordless), and guest access
- **Reading Progress Tracking** - Resume where you left off across devices
- **Library Management** - Bookmark and organize your favorite manga
- **Follow Updates** - Get notified when new chapters are released
- **Rating System** - Rate and review manga

### 🎯 Personalization (Contentstack Personalize)
- **Smart Recommendations** - Genre-based suggestions from your reading history
- **Welcome Experience** - Personalized greetings for new vs returning users
- **Audience Segmentation** - Tailored content based on reading preferences

### 🎨 Design
- **Japanese Aesthetic** - Beautiful UI inspired by traditional Japanese design
- **Dark Theme** - Eye-friendly dark mode optimized for reading
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations** - Subtle animations and transitions

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **CMS** | Contentstack |
| **Personalization** | Contentstack Personalize Edge SDK |
| **Database** | SQLite with Prisma ORM |
| **Authentication** | JWT + Magic Links |
| **Icons** | Lucide React |

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or yarn/pnpm)
- **Contentstack Account** with:
  - Delivery API credentials
  - (Optional) Personalize enabled on your organization

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mangaFan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# ============================================
# CONTENTSTACK CONFIGURATION (Required)
# ============================================
NEXT_PUBLIC_CONTENTSTACK_API_KEY=your_api_key
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=your_environment
NEXT_PUBLIC_CONTENTSTACK_REGION=us  # or 'eu', 'azure-na', etc.

# ============================================
# APPLICATION SETTINGS
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# AUTHENTICATION (Required for backend features)
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# ============================================
# EMAIL (Required for magic links)
# ============================================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@mangafan.com

# ============================================
# CONTENTSTACK PERSONALIZE (Optional)
# ============================================
NEXT_PUBLIC_PERSONALIZE_PROJECT_UID=your_personalize_project_uid

# ============================================
# CONTENTSTACK MANAGEMENT (Optional - for admin features)
# ============================================
CONTENTSTACK_MANAGEMENT_TOKEN=your_management_token
```

### 4. Set Up the Database

```bash
# Generate Prisma client and set up SQLite database
npm run db:setup
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
mangaFan/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database (gitignored)
│
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # API routes (backend)
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── bookmarks/     # Bookmark management
│   │   │   ├── ratings/       # Rating system
│   │   │   ├── subscriptions/ # Follow/notification subscriptions
│   │   │   ├── reading-progress/ # Reading progress tracking
│   │   │   └── webhooks/      # Contentstack webhooks
│   │   ├── [mangaSlug]/       # Manga detail page
│   │   │   └── [chapterSlug]/ # Chapter reader page
│   │   ├── discover/          # Browse/discover page
│   │   ├── library/           # User library page
│   │   ├── login/             # Authentication page
│   │   ├── profile/           # User profile page
│   │   └── page.tsx           # Home page
│   │
│   ├── core/
│   │   └── providers/         # React Context providers
│   │       ├── auth-provider.tsx
│   │       ├── backend-library-provider.tsx
│   │       ├── personalize-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── user-library-provider.tsx
│   │
│   ├── components/
│   │   └── personalized/      # Personalized content components
│   │       ├── WelcomeBanner.tsx
│   │       └── PersonalizedRecommendations.tsx
│   │
│   ├── features/
│   │   └── manga/             # Manga feature module
│   │       ├── components/    # Manga-specific components
│   │       ├── hooks/         # Data fetching hooks
│   │       └── types/         # TypeScript types
│   │
│   ├── lib/
│   │   ├── api/               # API client
│   │   ├── auth/              # Authentication utilities
│   │   ├── contentstack/      # Contentstack SDK setup
│   │   └── db/                # Database client
│   │
│   └── shared/
│       ├── components/        # Shared UI components
│       ├── hooks/             # Shared React hooks
│       └── lib/               # Utility functions
│
├── .env.local                 # Environment variables (create this)
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── prisma.config.ts           # Prisma configuration
└── package.json               # Dependencies and scripts
```

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:reset` | Reset database (WARNING: deletes all data) |
| `npm run db:setup` | Initial database setup |
| `npm run serve:dev` | Setup database + start dev server |
| `npm run serve:prod` | Setup database + build + start production |

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/magic-link` | Request magic link |
| `POST` | `/api/auth/verify-magic-link` | Verify magic link token |
| `POST` | `/api/auth/logout` | Logout (invalidate session) |
| `GET` | `/api/auth/me` | Get current user |
| `PATCH` | `/api/auth/me` | Update user profile |

### Library Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookmarks` | Get user's bookmarks |
| `POST` | `/api/bookmarks` | Add bookmark |
| `DELETE` | `/api/bookmarks` | Remove bookmark |
| `GET` | `/api/ratings` | Get user's ratings |
| `POST` | `/api/ratings` | Rate a manga |
| `GET` | `/api/subscriptions` | Get subscriptions |
| `POST` | `/api/subscriptions` | Subscribe to manga updates |
| `DELETE` | `/api/subscriptions` | Unsubscribe |
| `GET` | `/api/reading-progress` | Get reading progress |
| `POST` | `/api/reading-progress` | Update reading progress |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/manga/[mangaUid]/stats` | Get manga statistics |
| `GET` | `/api/manga/[mangaUid]/subscribers` | Get subscriber emails (for webhooks) |

---

## 🎯 Contentstack Setup

### Required Content Types

Create these content types in your Contentstack stack:

#### 1. **Manga** (`manga`)
- `title` (Single Line Text)
- `url` (Single Line Text) - URL slug
- `description` (Multi Line Text)
- `manga_image` (File) - Cover image
- `banner_image` (File) - Banner image
- `author` (Reference to Author)
- `taxonomies` (Taxonomy) - Genre and Status
- `rating` (Group) - Contains rating stats

#### 2. **Manga List** (`manga_list`) - Chapters
- `title` (Single Line Text)
- `managa` (Reference to Manga)
- `panel` (Modular Blocks) - Chapter pages/panels

#### 3. **Author** (`author`)
- `title` (Single Line Text)
- `bio` (Multi Line Text)

### Required Taxonomies

1. **Genre** (`genre`)
   - Terms: action, adventure, fantasy, comedy, romance, horror, etc.

2. **Status** (`status`)
   - Terms: ongoing, completed, hiatus

---

## 🎨 Personalization Setup

See [PERSONALIZE_INTEGRATION.md](./PERSONALIZE_INTEGRATION.md) for detailed setup instructions.

### Quick Overview

1. **Enable Personalize** on your Contentstack organization
2. **Create a Project** and link it to your stack
3. **Create Audiences:**
   - New Users (session_count = 1)
   - Returning Users (session_count > 1)
   - Genre-specific audiences (has_read_action = true, etc.)
4. **Create Experiences** for personalized content
5. **Set `NEXT_PUBLIC_PERSONALIZE_PROJECT_UID`** in your `.env.local`

---

## 🔒 Security Features

- **Encrypted Session Storage** - Tokens encrypted with AES-GCM using browser fingerprint
- **JWT Authentication** - Secure token-based authentication
- **CORS Configuration** - Proper cross-origin request handling
- **Input Validation** - Server-side validation on all API routes
- **SQL Injection Prevention** - Prisma ORM with parameterized queries

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

> **Note:** For SQLite in production, consider migrating to PostgreSQL or a serverless database like Turso/PlanetScale.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `NEXT_PUBLIC_APP_URL` matches your domain
- Check that middleware is properly configured

**2. Database Errors**
```bash
# Reset the database
npm run db:reset
```

**3. Contentstack Errors**
- Verify API credentials in `.env.local`
- Check content type UIDs match your schema

**4. Magic Link Not Sending**
- Verify SMTP credentials
- Check spam folder
- For development, check console for magic link URL

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Contentstack](https://www.contentstack.com/) - Headless CMS
- [Next.js](https://nextjs.org/) - React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Database ORM
- [Lucide](https://lucide.dev/) - Icon library

---

<div align="center">

**Made with ❤️ for manga lovers**

マンガファン

</div>

