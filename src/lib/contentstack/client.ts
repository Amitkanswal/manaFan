import Contentstack, { Region } from '@contentstack/delivery-sdk';

// Map environment variable to SDK region
const getRegion = (): Region => {
  const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION?.toLowerCase();
  if (region === 'eu') return Region.EU;
  if (region === 'azure-na') return Region.AZURE_NA;
  if (region === 'azure-eu') return Region.AZURE_EU;
  return Region.US; // Default to US (NA)
};

// Contentstack client configuration
const stack = Contentstack.stack({
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY || '',
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN || '',
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT || 'production',
  region: getRegion(),
});

export { stack };

// Content type UIDs from schema
export const CONTENT_TYPES = {
  MANGA: 'manga',
  MANGA_LIST: 'manga_list',
  AUTHOR: 'author',
} as const;

// Taxonomy UIDs
export const TAXONOMIES = {
  GENRE: 'genre',
  STATUS: 'status',
} as const;
