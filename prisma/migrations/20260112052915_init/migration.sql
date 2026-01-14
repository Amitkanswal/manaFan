-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailUpdatesOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "mangaTitle" TEXT NOT NULL,
    "mangaCover" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "mangaTitle" TEXT NOT NULL,
    "notifyNewChapter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "mangaTitle" TEXT NOT NULL,
    "mangaCover" TEXT,
    "lastChapterUid" TEXT NOT NULL,
    "lastChapterSlug" TEXT NOT NULL,
    "lastChapterNumber" INTEGER NOT NULL,
    "lastChapterTitle" TEXT NOT NULL,
    "totalChapters" INTEGER NOT NULL,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViewHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "chapterUid" TEXT,
    "chapterSlug" TEXT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MangaStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaUid" TEXT NOT NULL,
    "mangaSlug" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "avgRating" REAL NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "totalBookmarks" INTEGER NOT NULL DEFAULT 0,
    "totalSubscribers" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaUid" TEXT NOT NULL,
    "chapterUid" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "emailSentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_userId_idx" ON "MagicLink"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_mangaUid_idx" ON "Bookmark"("mangaUid");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_mangaUid_key" ON "Bookmark"("userId", "mangaUid");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE INDEX "Rating_mangaUid_idx" ON "Rating"("mangaUid");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_mangaUid_key" ON "Rating"("userId", "mangaUid");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_mangaUid_idx" ON "Subscription"("mangaUid");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_mangaUid_key" ON "Subscription"("userId", "mangaUid");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_idx" ON "ReadingProgress"("userId");

-- CreateIndex
CREATE INDEX "ReadingProgress_mangaUid_idx" ON "ReadingProgress"("mangaUid");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_mangaUid_key" ON "ReadingProgress"("userId", "mangaUid");

-- CreateIndex
CREATE INDEX "ViewHistory_userId_idx" ON "ViewHistory"("userId");

-- CreateIndex
CREATE INDEX "ViewHistory_mangaUid_idx" ON "ViewHistory"("mangaUid");

-- CreateIndex
CREATE INDEX "ViewHistory_sessionId_idx" ON "ViewHistory"("sessionId");

-- CreateIndex
CREATE INDEX "ViewHistory_viewedAt_idx" ON "ViewHistory"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MangaStats_mangaUid_key" ON "MangaStats"("mangaUid");

-- CreateIndex
CREATE INDEX "MangaStats_mangaUid_idx" ON "MangaStats"("mangaUid");

-- CreateIndex
CREATE INDEX "MangaStats_mangaSlug_idx" ON "MangaStats"("mangaSlug");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_mangaUid_idx" ON "NotificationLog"("mangaUid");

-- CreateIndex
CREATE INDEX "NotificationLog_emailSentAt_idx" ON "NotificationLog"("emailSentAt");
