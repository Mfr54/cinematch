import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Genre, Recommendation, UserProfile, UserRating } from '../../content/types';
import { RecommendationService } from '../services/recommendationService';
import type { RecommendationFiltersState } from './useRecommendationFilters';
import type { AppSettings } from '../../profile/components/SettingsModal';

export interface RecommendationEngineState {
  recommendations: Recommendation[];
  filteredRecommendations: Recommendation[];
  loading: boolean;
  progress: {
    current: number;
    total: number;
    message: string;
  };
  refreshRecommendations: () => Promise<Recommendation[] | void>;
  replaceRecommendations: (items: Recommendation[]) => void;
  clearRecommendations: () => void;
}

interface Params {
  profile: UserProfile | null;
  genres: Genre[];
  tvGenres: Genre[];
  ratings: UserRating[];
  filters: RecommendationFiltersState;
  settings?: AppSettings;
  watchlistIds: number[];
  onError: (error: unknown, context: string) => void;
}

const arraysEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const hasMeaningfulFilterChange = (
  prev: RecommendationFiltersState,
  next: RecommendationFiltersState
) => {
  if (prev === next) {
    return false;
  }

  return (
    prev.minYear !== next.minYear ||
    prev.maxYear !== next.maxYear ||
    prev.minRating !== next.minRating ||
    prev.maxRating !== next.maxRating ||
    prev.mediaType !== next.mediaType ||
    prev.minMatchScore !== next.minMatchScore ||
    prev.showKidsContent !== next.showKidsContent ||
    prev.showAnimationContent !== next.showAnimationContent ||
    prev.showAnimeContent !== next.showAnimeContent ||
    !arraysEqual(prev.genres, next.genres) ||
    !arraysEqual(prev.languages, next.languages)
  );
};

const sortRecommendations = (
  items: Recommendation[],
  sortBy: RecommendationFiltersState['sortBy']
): Recommendation[] => {
  const list = [...items];
  list.sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.movie?.vote_average ?? 0) - (a.movie?.vote_average ?? 0);
      case 'year': {
        const getYear = (rec: Recommendation) => {
          const movie = rec.movie as any;
          const date = movie?.release_date || movie?.first_air_date;
          return date ? new Date(date).getFullYear() : 0;
        };
        return getYear(b) - getYear(a);
      }
      case 'title': {
        const getTitle = (rec: Recommendation) => {
          const movie = rec.movie as any;
          return movie?.title || movie?.name || '';
        };
        return getTitle(a).localeCompare(getTitle(b), 'tr');
      }
      case 'match_score':
      default:
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    }
  });
  return list;
};

export const useRecommendationEngine = ({
  profile,
  genres,
  tvGenres,
  ratings,
  filters,
  settings,
  watchlistIds,
  onError
}: Params): RecommendationEngineState => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const filtersRef = useRef(filters);
  const filtersBootstrappedRef = useRef(false);
  const pendingRefreshRef = useRef(false);

  const shouldRequest = useMemo(() => {
    return Boolean(profile);
  }, [profile]);

  useEffect(() => {
    setFilteredRecommendations(sortRecommendations(recommendations, filters.sortBy));
  }, [recommendations, filters.sortBy]);

  const replaceRecommendations = useCallback((items: Recommendation[]) => {
    setRecommendations(items);
    setFilteredRecommendations(sortRecommendations(items, filters.sortBy));
  }, [filters.sortBy]);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setFilteredRecommendations([]);
  }, []);

  const refreshRecommendations = useCallback(async () => {
    if (!shouldRequest) {
      pendingRefreshRef.current = false;
      return undefined;
    }

    if (loading) {
      pendingRefreshRef.current = true;
      return undefined;
    }

    pendingRefreshRef.current = false;

    setLoading(true);
    setProgress({ current: 0, total: 3, message: 'Öneriler hazırlanıyor...' });

    try {
      setProgress({ current: 1, total: 3, message: 'Öneriler hesaplanıyor...' });
      const items = await RecommendationService.generateRecommendations(
        profile!,
        genres,
        tvGenres,
        ratings,
        filters,
        settings?.recommendationCount !== undefined ? { recommendationCount: settings.recommendationCount } : undefined,
        watchlistIds
      );

      replaceRecommendations(items);
      setProgress({ current: 3, total: 3, message: 'Öneriler hazır!' });
      return items;
    } catch (error) {
      onError(error, 'Öneri yenileme');
      clearRecommendations();
      return undefined;
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  }, [
    shouldRequest,
    loading,
    profile,
    genres,
    tvGenres,
    ratings,
    filters,
    settings?.recommendationCount,
    watchlistIds,
    onError,
    replaceRecommendations,
    clearRecommendations
  ]);

  useEffect(() => {
    if (!loading && pendingRefreshRef.current) {
      pendingRefreshRef.current = false;
      refreshRecommendations();
    }
  }, [loading, refreshRecommendations]);

  useEffect(() => {
    if (!filtersBootstrappedRef.current) {
      filtersBootstrappedRef.current = true;
      filtersRef.current = filters;
      return;
    }

    const previousFilters = filtersRef.current;
    filtersRef.current = filters;

    if (!shouldRequest) {
      return;
    }

    if (!hasMeaningfulFilterChange(previousFilters, filters)) {
      return;
    }

    refreshRecommendations();
  }, [filters, refreshRecommendations, shouldRequest]);

  return {
    recommendations,
    filteredRecommendations,
    loading,
    progress,
    refreshRecommendations,
    replaceRecommendations,
    clearRecommendations
  };
};
