/**
 * API Client for backend services
 * Handles authentication tokens and common request patterns
 * 
 * Uses relative URLs to avoid CORS issues when running on same origin
 */

interface RequestOptions extends RequestInit {
  token?: string;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  aborted?: boolean;
}

/**
 * Make an authenticated API request
 * Uses relative URLs to avoid CORS issues
 * Supports AbortController for request cancellation
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, signal, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Use relative URL to avoid CORS issues
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
      credentials: 'same-origin', // Include cookies for same-origin requests
      signal, // Support abort signal
    });

    // Handle empty responses (204 No Content)
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = {};
    }

    if (!response.ok) {
      return {
        error: data.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        error: 'Request cancelled',
        status: 0,
        aborted: true,
      };
    }
    
    console.error('API request error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  register: (email: string, password?: string, name?: string) =>
    apiRequest<{ message: string; user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiRequest<{ message: string; user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  requestMagicLink: (email: string) =>
    apiRequest<{ message: string }>('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyMagicLink: (token: string) =>
    apiRequest<{ message: string; user: any; token: string }>('/api/auth/verify-magic-link', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  logout: (token: string) =>
    apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      token,
    }),

  getMe: (token: string) =>
    apiRequest<{ user: any }>('/api/auth/me', { token }),

  updateProfile: (token: string, data: { name?: string; emailUpdatesOptIn?: boolean }) =>
    apiRequest<{ message: string; user: any }>('/api/auth/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),
};

// ============================================
// BOOKMARKS API
// ============================================

export const bookmarksApi = {
  getAll: (token: string) =>
    apiRequest<{ bookmarks: any[] }>('/api/bookmarks', { token }),

  add: (token: string, manga: { mangaUid: string; mangaSlug: string; mangaTitle: string; mangaCover?: string }) =>
    apiRequest<{ message: string; bookmark: any }>('/api/bookmarks', {
      method: 'POST',
      token,
      body: JSON.stringify(manga),
    }),

  remove: (token: string, mangaUid: string) =>
    apiRequest<{ message: string }>('/api/bookmarks', {
      method: 'DELETE',
      token,
      body: JSON.stringify({ mangaUid }),
    }),
};

// ============================================
// RATINGS API
// ============================================

export const ratingsApi = {
  getAll: (token: string) =>
    apiRequest<{ ratings: any[] }>('/api/ratings', { token }),

  get: (token: string, mangaUid: string) =>
    apiRequest<{ rating: number | null }>(`/api/ratings?mangaUid=${mangaUid}`, { token }),

  rate: (token: string, data: { mangaUid: string; mangaSlug: string; rating: number }) =>
    apiRequest<{ message: string; rating: any; avgRating: number; totalRatings: number }>('/api/ratings', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  remove: (token: string, mangaUid: string) =>
    apiRequest<{ message: string }>('/api/ratings', {
      method: 'DELETE',
      token,
      body: JSON.stringify({ mangaUid }),
    }),
};

// ============================================
// SUBSCRIPTIONS API
// ============================================

export const subscriptionsApi = {
  getAll: (token: string) =>
    apiRequest<{ subscriptions: any[] }>('/api/subscriptions', { token }),

  subscribe: (token: string, data: { mangaUid: string; mangaSlug: string; mangaTitle: string; notifyNewChapter?: boolean }) =>
    apiRequest<{ message: string; subscription: any }>('/api/subscriptions', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  unsubscribe: (token: string, mangaUid: string) =>
    apiRequest<{ message: string }>('/api/subscriptions', {
      method: 'DELETE',
      token,
      body: JSON.stringify({ mangaUid }),
    }),
};

// ============================================
// VIEWS API (works for guests too)
// ============================================

export const viewsApi = {
  track: (data: { mangaUid: string; mangaSlug: string; chapterUid?: string; chapterSlug?: string }, token?: string) =>
    apiRequest<{ message: string }>('/api/views', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  getHistory: (token: string, limit = 50, offset = 0) =>
    apiRequest<{ history: any[] }>(`/api/views?limit=${limit}&offset=${offset}`, { token }),
};

// ============================================
// READING PROGRESS API
// ============================================

export const readingProgressApi = {
  getAll: (token: string) =>
    apiRequest<{ progress: any[] }>('/api/reading-progress', { token }),

  get: (token: string, mangaUid: string) =>
    apiRequest<{ progress: any }>(`/api/reading-progress?mangaUid=${mangaUid}`, { token }),

  update: (token: string, data: {
    mangaUid: string;
    mangaSlug: string;
    mangaTitle: string;
    mangaCover?: string;
    chapterUid: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle?: string;
    totalChapters?: number;
  }) =>
    apiRequest<{ message: string; progress: any }>('/api/reading-progress', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),
};

// ============================================
// MANGA STATS API (public)
// ============================================

export const mangaStatsApi = {
  get: (mangaUid: string) =>
    apiRequest<{
      mangaUid: string;
      totalViews: number;
      uniqueViewers: number;
      avgRating: number;
      totalRatings: number;
      totalBookmarks: number;
      totalSubscribers: number;
    }>(`/api/manga/${mangaUid}/stats`),
};

