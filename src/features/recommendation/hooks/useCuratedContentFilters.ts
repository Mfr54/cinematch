import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../../profile/components/SettingsModal';
import type { CuratedContentFilters } from '../components/CuratedContentFilters';

export type CuratedFiltersState = CuratedContentFilters;

const STORAGE_KEY = 'curatedContentFilters';

const getDefaultCuratedFilters = (settings?: AppSettings): CuratedFiltersState => ({
  mediaType: 'all',
  minRating: settings?.defaultFilters?.minRating ?? 0,
  maxRating: settings?.defaultFilters?.maxRating ?? 10,
  minYear: settings?.defaultFilters?.minYear ?? 1900,
  maxYear: settings?.defaultFilters?.maxYear ?? new Date().getFullYear(),
  genres: [],
  sortBy: 'rating',
  sortOrder: 'desc',
  minVoteCount: 0,
  languages: []
});

const parseStoredCuratedFilters = (value: string | null, settings?: AppSettings): CuratedFiltersState => {
  if (!value) {
    return getDefaultCuratedFilters(settings);
  }

  try {
    const parsed = JSON.parse(value);
    return {
      ...getDefaultCuratedFilters(settings),
      ...parsed,
      mediaType: parsed.mediaType === 'movie' || parsed.mediaType === 'tv' ? parsed.mediaType : 'all',
      sortBy: parsed.sortBy ?? 'rating',
      sortOrder: parsed.sortOrder === 'asc' ? 'asc' : 'desc',
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : []
    };
  } catch (error) {
    console.warn('Failed to parse curated filters from storage:', error);
    return getDefaultCuratedFilters(settings);
  }
};

export const useCuratedContentFilters = (settings?: AppSettings) => {
  const defaults = useMemo(() => getDefaultCuratedFilters(settings), [settings]);
  const [filters, setFilters] = useState<CuratedFiltersState>(() => {
    if (typeof window === 'undefined') {
      return defaults;
    }
    try {
      return parseStoredCuratedFilters(localStorage.getItem(STORAGE_KEY), settings);
    } catch (error) {
      console.warn('Failed to read curated filters from storage:', error);
      return defaults;
    }
  });
  const [showCuratedFilters, setShowCuratedFilters] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to persist curated filters:', error);
    }
  }, [filters]);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      minRating: defaults.minRating,
      maxRating: defaults.maxRating,
      minYear: defaults.minYear,
      maxYear: defaults.maxYear,
      languages: Array.isArray(prev.languages) ? prev.languages : []
    }));
  }, [defaults]);

  const updateFilters = useCallback((updates: Partial<CuratedFiltersState>) => {
    setFilters(prev => {
      const genres = updates.genres !== undefined ? updates.genres : prev.genres;
      const languages = updates.languages !== undefined ? updates.languages : prev.languages;

      const next: CuratedFiltersState = {
        mediaType: updates.mediaType ?? prev.mediaType,
        minRating: updates.minRating ?? prev.minRating,
        maxRating: updates.maxRating ?? prev.maxRating,
        minYear: updates.minYear ?? prev.minYear,
        maxYear: updates.maxYear ?? prev.maxYear,
        genres,
        sortBy: updates.sortBy ?? prev.sortBy,
        sortOrder: updates.sortOrder ?? prev.sortOrder,
        minVoteCount: updates.minVoteCount ?? prev.minVoteCount,
        languages: Array.isArray(languages) ? languages : []
      };
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultCuratedFilters(settings));
  }, [settings]);

  return {
    curatedContentFilters: filters,
    setCuratedContentFilters: setFilters,
    updateCuratedContentFilters: updateFilters,
    resetCuratedContentFilters: resetFilters,
    showCuratedFilters,
    setShowCuratedFilters
  } as const;
};
