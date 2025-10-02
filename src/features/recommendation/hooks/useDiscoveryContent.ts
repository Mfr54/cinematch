import { useCallback, useEffect, useState } from 'react';
import type { Movie, TVShow, UserRating } from '../../content/types';
import { CuratedMovieService } from '../services/curatedMovieService';
import type { CuratedFiltersState } from './useCuratedContentFilters';
import type { AppSettings } from '../../profile/components/SettingsModal';

interface ProgressState {
  current: number;
  total: number;
  message: string;
}

interface Params {
  filters: CuratedFiltersState;
  settings?: AppSettings;
  onError: (error: unknown, context: string) => void;
}

export interface DiscoveryContentState {
  movies: (Movie | TVShow)[];
  allMovies: (Movie | TVShow)[];
  loading: boolean;
  progress: ProgressState;
  replaceContent: (items: (Movie | TVShow)[]) => void;
  removeContentById: (id: number) => void;
  refreshCuratedContent: (ratings: UserRating[]) => Promise<void>;
  setContentDirectly: (items: (Movie | TVShow)[]) => void;
}

const filterBySettings = (
  items: (Movie | TVShow)[],
  settings?: AppSettings
): (Movie | TVShow)[] => {
  let results = items;
  if (settings?.minContentRating !== undefined) {
    results = results.filter(item => (item.vote_average ?? 0) >= settings.minContentRating!);
  }

  if (settings?.minTmdbScore !== undefined) {
    results = results.filter(item => (item.vote_average ?? 0) >= settings.minTmdbScore!);
  }

  if (settings?.minTmdbVoteCount !== undefined) {
    results = results.filter(item => (item.vote_count ?? 0) >= settings.minTmdbVoteCount!);
  }

  if (settings && settings.showAdultContent === false) {
    results = results.filter(item => !('adult' in item && Boolean(item.adult)));
  }

  return results;
};

const applyCuratedFilters = (
  items: (Movie | TVShow)[],
  filters: CuratedFiltersState
): (Movie | TVShow)[] => {
  let filtered = [...items];

  if (filters.mediaType !== 'all') {
    filtered = filtered.filter(item => {
      if (!item) return false;
      if (filters.mediaType === 'movie') {
        return item.media_type === 'movie' || 'title' in item;
      }
      return item.media_type === 'tv' || 'name' in item;
    });
  }

  filtered = filtered.filter(item => {
    if (typeof item.vote_average !== 'number') return false;
    return item.vote_average >= filters.minRating && item.vote_average <= filters.maxRating;
  });

  filtered = filtered.filter(item => {
    let year = 0;
    if ('release_date' in item && item.release_date) {
      year = new Date(item.release_date).getFullYear();
    } else if ('first_air_date' in item && item.first_air_date) {
      year = new Date(item.first_air_date).getFullYear();
    }
    return year === 0 || (year >= filters.minYear && year <= filters.maxYear);
  });

  filtered = filtered.filter(item => {
    if (typeof item.vote_count !== 'number') return false;
    return item.vote_count >= filters.minVoteCount;
  });

  if (Array.isArray(filters.genres) && filters.genres.length > 0) {
    filtered = filtered.filter(item => {
      if (!Array.isArray(item.genre_ids)) return false;
      return filters.genres.some(id => item.genre_ids!.includes(id));
    });
  }

  if (Array.isArray(filters.languages) && filters.languages.length > 0) {
    filtered = filtered.filter(item => filters.languages!.includes(item.original_language ?? ''));
  }

  filtered.sort((a, b) => {
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    switch (filters.sortBy) {
      case 'year': {
        const getYear = (entry: Movie | TVShow) => {
          const date = 'release_date' in entry ? entry.release_date : (entry as TVShow).first_air_date;
          return date ? new Date(date).getFullYear() : 0;
        };
        return (getYear(a) - getYear(b)) * sortOrder;
      }
      case 'title': {
        const getTitle = (entry: Movie | TVShow) => ('title' in entry ? entry.title : (entry as TVShow).name) ?? '';
        return getTitle(a).localeCompare(getTitle(b), 'tr') * sortOrder;
      }
      case 'popularity':
        return ((a.vote_count ?? 0) - (b.vote_count ?? 0)) * sortOrder;
      case 'rating':
      default:
        return ((a.vote_average ?? 0) - (b.vote_average ?? 0)) * sortOrder;
    }
  });

  return filtered;
};

export const useDiscoveryContent = ({ filters, settings, onError }: Params): DiscoveryContentState => {
  const [allMovies, setAllMovies] = useState<(Movie | TVShow)[]>([]);
  const [movies, setMovies] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, message: '' });

  useEffect(() => {
    setMovies(applyCuratedFilters(filterBySettings(allMovies, settings), filters));
  }, [allMovies, filters, settings]);

  const replaceContent = useCallback((items: (Movie | TVShow)[]) => {
    setAllMovies(items);
    setMovies(applyCuratedFilters(filterBySettings(items, settings), filters));
  }, [filters, settings]);

  const setContentDirectly = useCallback((items: (Movie | TVShow)[]) => {
    setAllMovies([...items]);
    setMovies([...items]);
  }, []);

  const removeContentById = useCallback((id: number) => {
    setAllMovies(prev => prev.filter(item => item.id !== id));
    setMovies(prev => prev.filter(item => item.id !== id));
  }, []);

  const refreshCuratedContent = useCallback(async (ratings: UserRating[]) => {
    if (loading) return;

    setLoading(true);
    setProgress({ current: 0, total: 3, message: 'Keşif içerikleri hazırlanıyor...' });

    try {
      setProgress({ current: 1, total: 3, message: 'Filtrelere göre içerik aranıyor...' });
      const newContent = await CuratedMovieService.getCuratedContentWithFilters(ratings, filters);
      replaceContent(newContent);
      setProgress({ current: 3, total: 3, message: 'Keşif içerikleri hazır!' });
    } catch (error) {
      onError(error, 'Keşif içerikleri yenileme');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  }, [filters, loading, onError, replaceContent]);

  return {
    movies,
    allMovies,
    loading,
    progress,
    replaceContent,
    removeContentById,
    refreshCuratedContent,
    setContentDirectly
  };
};
