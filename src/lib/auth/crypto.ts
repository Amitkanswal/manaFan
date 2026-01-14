/**
 * Client-side encryption utilities for secure session storage
 * Uses Web Crypto API for AES-GCM encryption
 */

// Generate a key from a password/seed (derived from browser fingerprint)
async function getEncryptionKey(): Promise<CryptoKey> {
  // Create a stable seed based on browser characteristics
  const seed = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ].join('|');

  // Convert seed to bytes
  const encoder = new TextEncoder();
  const seedBytes = encoder.encode(seed);

  // Import as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seedBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('mangafan-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data for secure storage
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBytes
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 without spread operator for compatibility
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to simple base64 encoding if crypto fails
    return btoa(data);
  }
}

/**
 * Decrypt data from secure storage
 */
export async function decryptData(encryptedData: string): Promise<string | null> {
  try {
    const key = await getEncryptionKey();

    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    // Try fallback base64 decoding
    try {
      return atob(encryptedData);
    } catch {
      return null;
    }
  }
}

/**
 * Secure session storage wrapper with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const encrypted = await encryptData(value);
    sessionStorage.setItem(key, encrypted);
  },

  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    return decryptData(encrypted);
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
  },
};

