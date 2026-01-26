/**
 * Contentstack CMA (Content Management API) Service
 * Server-side only - uses management token for authenticated API calls
 */

const CMA_BASE_URL = 'https://api.contentstack.io/v3';

// CMA Configuration from environment
const getCMAConfig = () => ({
  apiKey: process.env.CONTENTSTACK_API_KEY || process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY || '',
  managementToken: process.env.CONTENTSTACK_MANAGEMENT_TOKEN || '',
});

// CMA Response types
export interface CMAEntry {
  uid: string;
  title: string;
  url?: string;
  created_at: string;
  updated_at: string;
  _version: number;
  locale: string;
  [key: string]: unknown;
}

export interface CMAEntriesResponse {
  entries: CMAEntry[];
  count: number;
}

export interface CMATaxonomyTerm {
  uid: string;
  name: string;
  taxonomy_uid: string;
  term_uid: string;
  depth: number;
  created_at: string;
  updated_at: string;
  ancestors?: Array<{ uid: string; name: string; term_uid: string }>;
}

export interface CMATaxonomyResponse {
  terms: CMATaxonomyTerm[];
  count: number;
}

/**
 * CMA API Service for server-side operations
 */
export const cmaApi = {
  /**
   * Get all entries from a content type using CMA
   */
  async getEntries(contentTypeUid: string, options?: {
    locale?: string;
    include_reference?: string[];
    query?: Record<string, unknown>;
  }): Promise<CMAEntriesResponse> {
    const config = getCMAConfig();
    
    if (!config.apiKey || !config.managementToken) {
      throw new Error('CMA configuration missing: API key or management token not set');
    }

    const params = new URLSearchParams();
    
    if (options?.locale) {
      params.append('locale', options.locale);
    } else {
      params.append('locale', 'en-us');
    }
    
    if (options?.include_reference?.length) {
      options.include_reference.forEach(ref => {
        params.append('include[]', ref);
      });
    }

    // Add query parameter for filtering
    if (options?.query) {
      params.append('query', JSON.stringify(options.query));
    }

    const url = `${CMA_BASE_URL}/content_types/${contentTypeUid}/entries?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.managementToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CMA] Error response:`, errorText);
      throw new Error(`CMA API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  },

  /**
   * Get a single entry by UID using CMA
   */
  async getEntry(contentTypeUid: string, entryUid: string, options?: {
    locale?: string;
    include_reference?: string[];
  }): Promise<{ entry: CMAEntry }> {
    const config = getCMAConfig();
    
    if (!config.apiKey || !config.managementToken) {
      throw new Error('CMA configuration missing');
    }

    const params = new URLSearchParams();
    
    if (options?.locale) {
      params.append('locale', options.locale);
    } else {
      params.append('locale', 'en-us');
    }
    
    if (options?.include_reference?.length) {
      options.include_reference.forEach(ref => {
        params.append('include[]', ref);
      });
    }

    const url = `${CMA_BASE_URL}/content_types/${contentTypeUid}/entries/${entryUid}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.managementToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CMA API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Get all taxonomy terms
   */
  async getTaxonomyTerms(taxonomyUid: string): Promise<CMATaxonomyResponse> {
    const config = getCMAConfig();
    
    if (!config.apiKey || !config.managementToken) {
      throw new Error('CMA configuration missing');
    }

    const url = `${CMA_BASE_URL}/taxonomies/${taxonomyUid}/terms`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.managementToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CMA] Taxonomy error:`, errorText);
      throw new Error(`CMA Taxonomy API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Get entries filtered by taxonomy term
   * Uses the taxonomy query syntax for CMA
   */
  async getEntriesByTaxonomy(contentTypeUid: string, taxonomyQuery: {
    taxonomyUid: string;
    termUid: string;
  }, options?: {
    locale?: string;
    include_reference?: string[];
  }): Promise<CMAEntriesResponse> {
    const config = getCMAConfig();
    
    if (!config.apiKey || !config.managementToken) {
      throw new Error('CMA configuration missing');
    }

    const params = new URLSearchParams();
    
    if (options?.locale) {
      params.append('locale', options.locale);
    } else {
      params.append('locale', 'en-us');
    }
    
    if (options?.include_reference?.length) {
      options.include_reference.forEach(ref => {
        params.append('include[]', ref);
      });
    }

    // Build taxonomy query
    // Contentstack taxonomy query format: {"taxonomies.{taxonomy_uid}": "{term_uid}"}
    const query = {
      [`taxonomies.${taxonomyQuery.taxonomyUid}`]: taxonomyQuery.termUid
    };
    params.append('query', JSON.stringify(query));

    const url = `${CMA_BASE_URL}/content_types/${contentTypeUid}/entries?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': config.apiKey,
        'authorization': config.managementToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CMA] Taxonomy filter error:`, errorText);
      throw new Error(`CMA API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },
};
