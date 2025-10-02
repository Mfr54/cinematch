import { useCallback, useEffect, useRef, useState } from 'react';
import type { Movie, TVShow, UserRating } from '../../content/types';
import { tmdbService } from '../../content/services/tmdb';
import type { AppSettings } from '../../profile/components/SettingsModal';

export interface SearchResultSummary {
  totalResults: number;
  searchType: 'content' | 'person' | 'mixed';
}

interface Params {
  ratings: UserRating[];
  watchlistIds: number[];
  settings?: AppSettings;
  onError: (error: unknown, context: string) => void;
  onResults: (items: (Movie | TVShow)[], summary: SearchResultSummary) => void;
  onIdle?: () => void;
  onActive?: () => void;
}

const filterSearchResults = (
  items: (Movie | TVShow)[],
  ratings: UserRating[],
  watchlistIds: number[],
  settings?: AppSettings
) => {
  const excluded = new Set<number>();
  ratings
    .filter(r => r.rating === 'not_interested' || r.rating === 'skip' || typeof r.rating === 'number')
    .forEach(r => excluded.add(r.movieId));
  watchlistIds.forEach(id => excluded.add(id));

  let filtered = items.filter(item => !excluded.has(item.id));

  if (settings?.minContentRating !== undefined) {
    filtered = filtered.filter(item => (item.vote_average ?? 0) >= settings.minContentRating!);
  }

  if (settings?.minTmdbScore !== undefined) {
    filtered = filtered.filter(item => (item.vote_average ?? 0) >= settings.minTmdbScore!);
  }

  if (settings?.minTmdbVoteCount !== undefined) {
    filtered = filtered.filter(item => (item.vote_count ?? 0) >= settings.minTmdbVoteCount!);
  }

  if (settings && settings.showAdultContent === false) {
    filtered = filtered.filter(item => !('adult' in item && Boolean(item.adult)));
  }

  return filtered;
};

export const useContentSearchController = ({
  ratings,
  watchlistIds,
  settings,
  onError,
  onResults,
  onIdle,
  onActive
}: Params) => {
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      onResults([], { totalResults: 0, searchType: 'content' });
      setIsSearching(false);
      onIdle?.();
      return;
    }

    try {
      onActive?.();
      setIsSearching(true);
      abortControllerRef.current = new AbortController();

      const response = await tmdbService.enhancedSearch(query);
      const combined = [
        ...(response.movies ?? []),
        ...(response.tvShows ?? [])
      ];
      const filtered = filterSearchResults(combined, ratings, watchlistIds, settings);
      onResults(filtered, {
        totalResults: response.totalResults,
        searchType: response.searchType
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      try {
        const fallback = await tmdbService.searchMulti(query);
        const filtered = filterSearchResults(fallback.results ?? [], ratings, watchlistIds, settings);
        onResults(filtered, {
          totalResults: fallback.total_results ?? 0,
          searchType: 'content'
        });
      } catch (fallbackError) {
        onError(fallbackError, 'Arama');
        onResults([], { totalResults: 0, searchType: 'content' });
      }
    } finally {
      setIsSearching(false);
      onIdle?.();
    }
  }, [onActive, ratings, watchlistIds, settings, onResults, onError, onIdle]);

  const search = useCallback((query: string, debounceMs = 500) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      timeoutRef.current = setTimeout(() => runSearch(query), debounceMs);
      return;
    }

    timeoutRef.current = setTimeout(() => runSearch(query), debounceMs);
  }, [runSearch]);

  const cancelSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortControllerRef.current?.abort();
    setIsSearching(false);
    onIdle?.();
  }, [onIdle]);

  useEffect(() => cancelSearch, [cancelSearch]);

  return {
    search,
    cancelSearch,
    isSearching
  } as const;
};
