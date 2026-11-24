import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Persists a value in localStorage per user.
 * Falls back to default if not set.
 */
export function usePreference(key, defaultValue) {
  const { user } = useAuth();
  const storageKey = user?.id ? `${key}_u${user.id}` : null;

  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [storageKey, value]);

  return [value, setValue];
}