import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../../profile/components/SettingsModal';

export type RecommendationFiltersState = {
  genres: number[];
  minYear: number;
  maxYear: number;
  minRating: number;
  maxRating: number;
  mediaType: 'all' | 'movie' | 'tv';
  sortBy: 'match_score' | 'rating' | 'year' | 'title';
  minMatchScore: number;
  languages: string[];
  showKidsContent: boolean;
  showAnimationContent: boolean;
  showAnimeContent: boolean;
};

const STORAGE_KEY = 'recommendationFilters';

const getDefaultFilters = (settings?: AppSettings): RecommendationFiltersState => ({
  genres: [],
  minYear: settings?.defaultFilters?.minYear ?? 1950,
  maxYear: settings?.defaultFilters?.maxYear ?? new Date().getFullYear(),
  minRating: settings?.defaultFilters?.minRating ?? 0,
  maxRating: settings?.defaultFilters?.maxRating ?? 10,
  mediaType: 'all',
  sortBy: 'match_score',
  minMatchScore: settings?.defaultFilters?.minMatchScore ?? 0,
  languages: [],
  showKidsContent: settings?.showKidsContent ?? false,
  showAnimationContent: settings?.showAnimationContent ?? true,
  showAnimeContent: settings?.showAnimeContent ?? true
});

const parseStoredFilters = (value: string | null, settings?: AppSettings): RecommendationFiltersState => {
  if (!value) {
    return getDefaultFilters(settings);
  }

  try {
    const parsed = JSON.parse(value);
    return {
      ...getDefaultFilters(settings),
      ...parsed,
      mediaType: parsed.mediaType === 'movie' || parsed.mediaType === 'tv' ? parsed.mediaType : 'all',
      sortBy: ['match_score', 'rating', 'year', 'title'].includes(parsed.sortBy)
        ? parsed.sortBy
        : 'match_score',
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : []
    } as RecommendationFiltersState;
  } catch (error) {
    console.warn('Failed to parse recommendation filters from storage:', error);
    return getDefaultFilters(settings);
  }
};

export const useRecommendationFilters = (settings?: AppSettings) => {
  const defaults = useMemo(() => getDefaultFilters(settings), [settings]);
  const [filters, setFilters] = useState<RecommendationFiltersState>(() => {
    if (typeof window === 'undefined') {
      return defaults;
    }
    try {
      return parseStoredFilters(localStorage.getItem(STORAGE_KEY), settings);
    } catch (error) {
      console.warn('Failed to read recommendation filters from storage:', error);
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to persist recommendation filters:', error);
    }
  }, [filters]);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      minYear: defaults.minYear,
      maxYear: defaults.maxYear,
      minRating: defaults.minRating,
      maxRating: defaults.maxRating,
      minMatchScore: defaults.minMatchScore,
      showKidsContent: defaults.showKidsContent,
      showAnimationContent: defaults.showAnimationContent,
      showAnimeContent: defaults.showAnimeContent
    }));
  }, [defaults]);

  const updateFilters = useCallback((updates: Partial<RecommendationFiltersState>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      genres: updates.genres ?? prev.genres,
      languages: updates.languages ?? prev.languages
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters(settings));
  }, [settings]);

  return {
    recommendationFilters: filters,
    setRecommendationFilters: setFilters,
    updateRecommendationFilters: updateFilters,
    resetRecommendationFilters: resetFilters
  } as const;
};
