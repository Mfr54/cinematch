/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Genre,
  Movie,
  TVShow,
  UserProfile,
  UserRating
} from '../../content/types';
import { tmdbService } from '../../content/services/tmdb';
import { StorageService } from '../../../shared/services/storage';
import { ProfileService } from '../../profile/services/profileService';
import { RealTimeLearningService } from '../../learning/services/realTimeLearningService';
import { RecommendationService } from '../services/recommendationService';
import { CuratedMovieService } from '../services/curatedMovieService';
import { useWatchlist } from './useWatchlist';
import { useSearchState } from './useSearchState';
import { useRecommendationFilters } from './useRecommendationFilters';
import type { RecommendationFiltersState } from './useRecommendationFilters';
import { useCuratedContentFilters } from './useCuratedContentFilters';
import { useRecommendationEngine } from './useRecommendationEngine';
import { useDiscoveryContent } from './useDiscoveryContent';
import { useContentSearchController, type SearchResultSummary } from './useContentSearchController';
import type { AppSettings } from '../../profile/components/SettingsModal';
import type { CuratedContentFilters } from '../components/CuratedContentFilters';

interface LoadingState {
  current: number;
  total: number;
  message: string;
}

type RatingValue = number | 'not_watched' | 'not_interested' | 'skip';

type SafeSetter = <T>(setter: Dispatch<SetStateAction<T>>, value: T, fallback: T) => void;

const EMPTY_PROGRESS: LoadingState = { current: 0, total: 0, message: '' };

const mergeRecommendationFilterSettings = (
  filters: ReturnType<typeof useRecommendationFilters>['recommendationFilters'],
  settings?: AppSettings
) => ({
  ...filters,
  showKidsContent: settings?.showKidsContent ?? filters.showKidsContent,
  showAnimationContent: settings?.showAnimationContent ?? filters.showAnimationContent,
  showAnimeContent: settings?.showAnimeContent ?? filters.showAnimeContent
});

const combineGenres = (movieGenres: Genre[], tvGenres: Genre[]) => [...movieGenres, ...tvGenres];

const arraysEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const hasMeaningfulRecommendationFilterChange = (
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

const hasMeaningfulCuratedFilterChange = (
  prev: ReturnType<typeof useCuratedContentFilters>['curatedContentFilters'],
  next: ReturnType<typeof useCuratedContentFilters>['curatedContentFilters']
) => {
  if (prev === next) {
    return false;
  }

  return (
    prev.mediaType !== next.mediaType ||
    prev.minRating !== next.minRating ||
    prev.maxRating !== next.maxRating ||
    prev.minYear !== next.minYear ||
    prev.maxYear !== next.maxYear ||
    prev.minVoteCount !== next.minVoteCount ||
    !arraysEqual(prev.genres, next.genres) ||
    !arraysEqual(prev.languages ?? [], next.languages ?? [])
  );
};

export const useMovieData = (settings?: AppSettings) => {
  const [ratings, setRatings] = useState<UserRating[]>(() => StorageService.getRatings() ?? []);
  const [profile, setProfile] = useState<UserProfile | null>(() => StorageService.getProfile());
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingState>(EMPTY_PROGRESS);
  const [error, setError] = useState<string | null>(null);

  const initialLoadRef = useRef(false);
  const ratingsRef = useRef<UserRating[]>(ratings);
  const profileRef = useRef<UserProfile | null>(profile);
  const searchCallbackRef = useRef<((summary: SearchResultSummary) => void) | undefined>(undefined);
  useEffect(() => {
    ratingsRef.current = ratings;
  }, [ratings]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const handleError = useCallback((err: unknown, context: string) => {
    console.error(`Error in ${context}:`, err);
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context} sırasında hata oluştu: ${message}`);
  }, []);

  const safeSetState = useCallback<SafeSetter>((setter, value, fallback) => {
    try {
      setter(value);
    } catch (err) {
      console.error('State update error:', err);
      setter(fallback);
    }
  }, []);

  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    syncWatchlist,
    clearWatchlist
  } = useWatchlist(handleError);

  const {
    searchQuery,
    setSearchQuery,
    showingCuratedMovies,
    setShowingCuratedMovies
  } = useSearchState();

  const {
    recommendationFilters,
    setRecommendationFilters: setRecommendationFiltersState,
    resetRecommendationFilters
  } = useRecommendationFilters(settings);

  const {
    curatedContentFilters,
    setCuratedContentFilters,
    resetCuratedContentFilters,
    showCuratedFilters,
    setShowCuratedFilters
  } = useCuratedContentFilters(settings);

  const curatedFiltersRef = useRef(curatedContentFilters);
  const curatedFilterBootstrappedRef = useRef(false);


  const discoveryContentParams: Parameters<typeof useDiscoveryContent>[0] = settings
    ? { filters: curatedContentFilters, settings, onError: handleError }
    : { filters: curatedContentFilters, onError: handleError };

  const {
    movies,
    allMovies,
    loading: curatedContentLoading,
    progress: curatedContentLoadingProgress,
    replaceContent,
    removeContentById,
    refreshCuratedContent: refreshDiscoveryContent,
    setContentDirectly
  } = useDiscoveryContent(discoveryContentParams);

  const watchlistIds = useMemo(() => watchlist.map(item => item.id), [watchlist]);

  const recommendationEngineParams: Parameters<typeof useRecommendationEngine>[0] = settings
    ? {
        profile,
        genres: movieGenres,
        tvGenres,
        ratings,
        filters: mergeRecommendationFilterSettings(recommendationFilters, settings),
        settings,
        watchlistIds,
        onError: handleError
      }
    : {
        profile,
        genres: movieGenres,
        tvGenres,
        ratings,
        filters: mergeRecommendationFilterSettings(recommendationFilters, settings),
        watchlistIds,
        onError: handleError
      };

  const {
    recommendations,
    filteredRecommendations,
    loading: recommendationsLoading,
    progress: recommendationsLoadingProgress,
    refreshRecommendations: refreshRecommendationEngine,
    replaceRecommendations,
    clearRecommendations
  } = useRecommendationEngine(recommendationEngineParams);

  useEffect(() => {
    if (!curatedFilterBootstrappedRef.current) {
      curatedFilterBootstrappedRef.current = true;
      curatedFiltersRef.current = curatedContentFilters;
      return;
    }

    const previousFilters = curatedFiltersRef.current;
    curatedFiltersRef.current = curatedContentFilters;

    if (hasMeaningfulCuratedFilterChange(previousFilters, curatedContentFilters)) {
      refreshDiscoveryContent(ratingsRef.current);
    }
  }, [curatedContentFilters, refreshDiscoveryContent]);

  const handleSearchResults = useCallback((items: (Movie | TVShow)[], summary: SearchResultSummary) => {
    setContentDirectly(items);
    setShowingCuratedMovies(false);
    if (searchCallbackRef.current) {
      searchCallbackRef.current(summary);
      searchCallbackRef.current = undefined;
    }
  }, [setContentDirectly, setShowingCuratedMovies]);

  const searchControllerParams = useMemo(() => (
    {
      ratings,
      watchlistIds,
      onError: handleError,
      onResults: handleSearchResults,
      onActive: () => {
        setLoading(true);
        setError(null);
      },
      onIdle: () => {
        setLoading(false);
      },
      ...(settings ? { settings } : {})
    }
  ), [ratings, watchlistIds, handleError, handleSearchResults, settings]);

  const { search, cancelSearch, isSearching } = useContentSearchController(searchControllerParams);

  const combinedGenres = useMemo(() => combineGenres(movieGenres, tvGenres), [movieGenres, tvGenres]);

  useEffect(() => {
    if (!searchQuery) {
      cancelSearch();
      setShowingCuratedMovies(true);
      if (searchCallbackRef.current) {
        searchCallbackRef.current({ totalResults: 0, searchType: 'content' });
        searchCallbackRef.current = undefined;
      }
      return;
    }

    search(searchQuery);
  }, [searchQuery, cancelSearch, setShowingCuratedMovies, search]);

  const searchMovies = useCallback((query: string, onSearchComplete?: (summary: SearchResultSummary) => void) => {
    searchCallbackRef.current = onSearchComplete;
    search(query);
  }, [search]);

  const loadInitialData = useCallback(async () => {
    if (initialLoadRef.current) {
      return;
    }
    initialLoadRef.current = true;

    setLoading(true);
    setLoadingProgress({ current: 0, total: 4, message: 'İlk veriler yükleniyor...' });

    try {
      const [genreResponse, tvGenreResponse] = await Promise.all([
        tmdbService.fetchGenres().catch(() => []),
        tmdbService.fetchTVGenres().catch(() => [])
      ]);
      safeSetState(setMovieGenres, genreResponse, []);
      safeSetState(setTvGenres, tvGenreResponse, []);

      setLoadingProgress({ current: 1, total: 4, message: 'Kullanıcı verileri yükleniyor...' });
      const storedRatings = StorageService.getRatings() ?? [];
      const storedProfile = StorageService.getProfile();
      safeSetState(setRatings, storedRatings, []);
      safeSetState(setProfile, storedProfile, null);
      ratingsRef.current = storedRatings;
      profileRef.current = storedProfile;
      const syncedWatchlist = syncWatchlist();

      const numericRatings = storedRatings.filter(r => typeof r.rating === 'number').length;

      setLoadingProgress({ current: 2, total: 4, message: 'Keşif içerikleri yükleniyor...' });
      const curatedContent =
        numericRatings === 0
          ? await CuratedMovieService.getInitialRatingContent()
          : await CuratedMovieService.getCuratedInitialContent(
              storedRatings,
              undefined,
              (syncedWatchlist ?? []).map(item => ({ id: item.id })),
              settings?.discoveryContentCount !== undefined
                ? { discoveryContentCount: settings.discoveryContentCount }
                : undefined
            );
      replaceContent(curatedContent);
      setShowingCuratedMovies(true);

      if (numericRatings >= 10 && storedProfile) {
        setLoadingProgress({ current: 3, total: 4, message: 'Öneriler hazırlanıyor...' });
        const initialRecommendations = await RecommendationService.generateRecommendations(
          storedProfile,
          genreResponse,
          tvGenreResponse,
          storedRatings,
          mergeRecommendationFilterSettings(recommendationFilters, settings),
          settings?.recommendationCount !== undefined ? { recommendationCount: settings.recommendationCount } : undefined,
          (syncedWatchlist ?? []).map(item => item.id)
        );
        replaceRecommendations(initialRecommendations);
      }

      setLoadingProgress({ current: 4, total: 4, message: 'Tamamlandı' });
    } catch (err) {
      handleError(err, 'İlk verileri yükleme');
    } finally {
      setLoading(false);
      setLoadingProgress(EMPTY_PROGRESS);
    }
  }, [
    handleError,
    recommendationFilters,
    replaceContent,
    replaceRecommendations,
    safeSetState,
    settings,
    syncWatchlist,
    setShowingCuratedMovies
  ]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const validRatingsCount = ratings.filter(r => typeof r.rating === 'number').length;
    if (validRatingsCount >= 10 && profile) {
      refreshRecommendationEngine();
    }
  }, [ratings, profile, refreshRecommendationEngine]);

  useEffect(() => {
    if (!profile || !settings?.recommendationCount) {
      return;
    }
    const timeout = setTimeout(() => {
      refreshRecommendationEngine();
    }, 500);
    return () => clearTimeout(timeout);
  }, [profile, settings?.recommendationCount, refreshRecommendationEngine]);

  useEffect(() => {
    if (!settings?.discoveryContentCount) {
      return;
    }
    const timeout = setTimeout(() => {
      refreshDiscoveryContent(ratingsRef.current);
    }, 500);
    return () => clearTimeout(timeout);
  }, [settings?.discoveryContentCount, refreshDiscoveryContent]);

  const getUserRating = useCallback((itemId: number): RatingValue | null => {
    return ratings.find(r => r.movieId === itemId)?.rating ?? null;
  }, [ratings]);

  const rateMovie = useCallback(async (itemId: number, rating: RatingValue, mediaType: 'movie' | 'tv' = 'movie') => {
    try {
      const existing = ratingsRef.current.filter(r => r.movieId !== itemId);
      const nextRatings: UserRating[] = [
        ...existing,
        {
          movieId: itemId,
          rating,
          timestamp: Date.now(),
          mediaType
        }
      ];

      setRatings(nextRatings);
      StorageService.saveRatings(nextRatings);

      if (rating !== 'skip') {
        tmdbService.cacheUserContent(itemId, mediaType);
      }

      if (rating !== 'not_watched' && rating !== 'skip') {
        removeFromWatchlist(itemId);
      }

      const validRatings = nextRatings.filter(r => typeof r.rating === 'number');
      if (validRatings.length >= 1) {
        try {
          const generatedProfile = await ProfileService.generateProfile(nextRatings);
          if (generatedProfile) {
            setProfile(generatedProfile);
            profileRef.current = generatedProfile;
          }
        } catch (err) {
          console.warn('Profile generation failed:', err);
        }
      }

      removeContentById(itemId);
      replaceRecommendations(
        recommendations.filter(rec => rec.movie.id !== itemId)
      );

      if (validRatings.length >= 3 && profileRef.current) {
        try {
          const learningEvent = {
            type: 'rating_added' as const,
            contentId: itemId,
            newRating: rating,
            mediaType
          };
          const learningResult = await RealTimeLearningService.processRatingEvent(
            learningEvent,
            profileRef.current,
            nextRatings
          );
          if (learningResult.shouldRetrainNeural) {
            await RealTimeLearningService.retrainNeuralNetworkIfNeeded(
              true,
              nextRatings,
              learningResult.updatedProfile
            );
          }
        } catch (err) {
          console.warn('Real-time learning failed:', err);
        }
      }
    } catch (err) {
      handleError(err, 'Puanlama');
    }
  }, [handleError, recommendations, removeContentById, removeFromWatchlist, replaceRecommendations, refreshRecommendationEngine, setRatings]);

  const refreshRecommendations = useCallback(() => {
    return refreshRecommendationEngine();
  }, [refreshRecommendationEngine]);

  const refreshCuratedContent = useCallback(() => {
    return refreshDiscoveryContent(ratingsRef.current);
  }, [refreshDiscoveryContent]);

  const loadAILearningContent = useCallback(async () => {
    setLoading(true);
    setLoadingProgress({ current: 0, total: 2, message: 'Öğrenme içerikleri hazırlanıyor...' });

    try {
      const ratedIds = new Set(ratingsRef.current.map(r => r.movieId));
      watchlistIds.forEach(id => ratedIds.add(id));

      const learningContent = await CuratedMovieService.getInitialRatingContent();
      const filteredContent = learningContent.filter(item => !ratedIds.has(item.id));

      setLoadingProgress({ current: 2, total: 2, message: 'Öğrenme içerikleri hazır!' });
      replaceContent(filteredContent);
      setShowingCuratedMovies(true);
      return filteredContent;
    } catch (err) {
      handleError(err, 'Öğrenme içerikleri yükleme');
      return [];
    } finally {
      setLoading(false);
      setLoadingProgress(EMPTY_PROGRESS);
    }
  }, [handleError, replaceContent, setShowingCuratedMovies, watchlistIds]);

  const exportData = useCallback(() => {
    try {
      return StorageService.exportData();
    } catch (err) {
      handleError(err, 'Veri dışa aktarma');
      return '{}';
    }
  }, [handleError]);

  const importData = useCallback(async (data: string) => {
    try {
      const success = await StorageService.importData(data);
      if (success) {
        safeSetState(setRatings, StorageService.getRatings() ?? [], []);
        safeSetState(setProfile, StorageService.getProfile(), null);
        syncWatchlist();
        await refreshRecommendations();
        await refreshCuratedContent();
      }
      return success;
    } catch (err) {
      handleError(err, 'Veri içe aktarma');
      return false;
    }
  }, [handleError, refreshCuratedContent, refreshRecommendations, safeSetState, syncWatchlist]);

  const clearData = useCallback(async () => {
    try {
      StorageService.clearAllData();
      RealTimeLearningService.clearLearningHistory();

      setRatings([]);
      clearWatchlist();
      setProfile(null);
      clearRecommendations();
      replaceContent([]);
      setSearchQuery('');
      setShowingCuratedMovies(true);
      resetRecommendationFilters();
      resetCuratedContentFilters();
      setShowCuratedFilters(false);

      try {
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('showingCuratedMovies');
        localStorage.removeItem('recommendationFilters');
        localStorage.removeItem('curatedContentFilters');
        localStorage.removeItem('onboardingCompleted');
        localStorage.removeItem('onboardingState');
      } catch (storageError) {
        console.warn('Failed to clear local storage keys:', storageError);
      }

      await loadInitialData();
    } catch (err) {
      handleError(err, 'Veri temizleme');
    }
  }, [clearWatchlist, clearRecommendations, handleError, loadInitialData, replaceContent, resetCuratedContentFilters, resetRecommendationFilters, setSearchQuery, setShowCuratedFilters, setShowingCuratedMovies]);

  return {
    user: null,
    profile,
    ratings,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    rateMovie,
    removeRating: undefined,
    updateProfile: undefined,
    movies,
    allMovies,
    genres: combinedGenres,
    recommendations,
    filteredRecommendations,
    loading: loading || isSearching,
    _loadingProgress: loadingProgress,
    recommendationsLoading,
    recommendationsLoadingProgress,
    curatedContentLoading,
    curatedContentLoadingProgress,
    searchQuery,
    showingCuratedMovies,
    recommendationFilters,
    curatedContentFilters: curatedContentFilters as CuratedContentFilters,
    showCuratedFilters,
    error,
    setSearchQuery,
    setRecommendationFilters: (value: SetStateAction<RecommendationFiltersState>) => {
      setRecommendationFiltersState(prevFilters => {
        const nextFilters =
          typeof value === 'function'
            ? (value as (current: RecommendationFiltersState) => RecommendationFiltersState)(prevFilters)
            : value;

        const shouldRefresh =
          hasMeaningfulRecommendationFilterChange(prevFilters, nextFilters) &&
          profileRef.current &&
          ratingsRef.current.filter(r => typeof r.rating === 'number').length >= 10;

        if (shouldRefresh) {
          setTimeout(() => {
            refreshRecommendationEngine();
          }, 0);
        }

        return nextFilters;
      });
    },
    setCuratedContentFilters,
    setShowCuratedFilters,
    searchMovies,
    getUserRating,
    isInWatchlist,
    exportData,
    importData,
    clearData,
    refreshRecommendations,
    refreshCuratedContent,
    loadAILearningContent
  } as const;
};
