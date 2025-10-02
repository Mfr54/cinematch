import { useCallback, useEffect, useState } from 'react';

const SEARCH_QUERY_KEY = 'searchQuery';
const SHOW_CURATED_KEY = 'showingCuratedMovies';

const readBoolean = (value: string | null, fallback: boolean): boolean => {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse stored curated flag:', error);
    return fallback;
  }
};

export const useSearchState = () => {
  const [searchQuery, setSearchQueryState] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    try {
      return localStorage.getItem(SEARCH_QUERY_KEY) || '';
    } catch (error) {
      console.warn('Failed to read stored search query:', error);
      return '';
    }
  });

  const [showingCuratedMovies, setShowingCuratedMoviesState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const stored = localStorage.getItem(SHOW_CURATED_KEY);
      return readBoolean(stored, true);
    } catch (error) {
      console.warn('Failed to read curated flag:', error);
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_QUERY_KEY, searchQuery);
    } catch (error) {
      console.warn('Failed to persist search query:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOW_CURATED_KEY, JSON.stringify(showingCuratedMovies));
    } catch (error) {
      console.warn('Failed to persist curated flag:', error);
    }
  }, [showingCuratedMovies]);

  const setSearchQuery = useCallback((query: string) => {
    if (typeof query === 'string') {
      setSearchQueryState(query);
    }
  }, []);

  const setShowingCuratedMovies = useCallback((value: boolean) => {
    setShowingCuratedMoviesState(Boolean(value));
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    showingCuratedMovies,
    setShowingCuratedMovies
  } as const;
};
