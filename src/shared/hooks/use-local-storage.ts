"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for localStorage with SSR support
 * Fixed stale closure issue by using functional updates
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Keep track of the key in a ref to avoid stale closures
  const keyRef = useRef(key);
  keyRef.current = key;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  // Uses functional update to avoid stale closure issues
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${keyRef.current}":`, error);
    }
  }, []); // No dependencies needed - uses refs and functional updates

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(keyRef.current);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, [initialValue]);

  return { value: storedValue, setValue, removeValue, isLoaded };
}


