import { useCallback, useState } from 'react';
import type { Movie, TVShow } from '../../content/types';
import { StorageService } from '../../../shared/services/storage';
import { tmdbService } from '../../content/services/tmdb';

export interface WatchlistEntry {
  id: number;
  content: Movie | TVShow;
  addedAt: number;
}

type ErrorHandler = (error: unknown, context: string) => void;

const ensureArray = (value: unknown): WatchlistEntry[] => {
  if (Array.isArray(value)) {
    return value as WatchlistEntry[];
  }
  return [];
};

export const useWatchlist = (onError?: ErrorHandler) => {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(() => {
    try {
      return ensureArray(StorageService.getWatchlist());
    } catch (error) {
      if (onError) {
        onError(error, 'watchlist initialization');
      } else {
        console.error('Watchlist initialization error:', error);
      }
      return [];
    }
  });

  const handleError = useCallback((error: unknown, context: string) => {
    if (onError) {
      onError(error, context);
    } else {
      console.error(`Watchlist error in ${context}:`, error);
    }
  }, [onError]);

  const updateWatchlist = useCallback((updater: (current: WatchlistEntry[]) => WatchlistEntry[]) => {
    setWatchlist(prev => {
      const current = ensureArray(prev);
      const next = updater(current);
      StorageService.saveWatchlist(next);
      return next;
    });
  }, []);

  const addToWatchlist = useCallback((content: Movie | TVShow) => {
    if (!content || typeof content.id !== 'number' || content.id <= 0) {
      handleError(new Error('Invalid content provided'), 'watchlist add');
      return;
    }

    try {
      updateWatchlist(prev => {
        if (prev.some(item => item.id === content.id)) {
          return prev;
        }

        const updated = [
          ...prev,
          { id: content.id, content, addedAt: Date.now() }
        ];

        const mediaType = 'media_type' in content && content.media_type === 'tv' ? 'tv' : 'movie';
        tmdbService.cacheUserContent(content.id, mediaType);

        return updated;
      });
    } catch (error) {
      handleError(error, 'watchlist add');
    }
  }, [handleError, updateWatchlist]);

  const removeFromWatchlist = useCallback((itemId: number) => {
    if (typeof itemId !== 'number' || itemId <= 0) {
      handleError(new Error('Invalid item id provided'), 'watchlist remove');
      return;
    }

    try {
      updateWatchlist(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      handleError(error, 'watchlist remove');
    }
  }, [handleError, updateWatchlist]);

  const isInWatchlist = useCallback((itemId: number) => {
    if (typeof itemId !== 'number' || itemId <= 0) {
      return false;
    }

    return watchlist.some(item => item.id === itemId);
  }, [watchlist]);

  const syncWatchlist = useCallback(() => {
    try {
      const stored = ensureArray(StorageService.getWatchlist());
      setWatchlist(stored);
      return stored;
    } catch (error) {
      handleError(error, 'watchlist sync');
      setWatchlist([]);
      return [];
    }
  }, [handleError]);

  const clearWatchlist = useCallback(() => {
    try {
      updateWatchlist(() => []);
    } catch (error) {
      handleError(error, 'watchlist clear');
    }
  }, [handleError, updateWatchlist]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    syncWatchlist,
    clearWatchlist
  } as const;
};
