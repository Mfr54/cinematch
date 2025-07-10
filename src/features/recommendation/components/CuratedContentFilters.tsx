import React from 'react';
import { Filter, X, Star, Calendar, Play, Tv, TrendingUp, RefreshCw } from 'lucide-react';
import type { Genre } from '../types';

export interface CuratedContentFilters {
  mediaType: 'all' | 'movie' | 'tv';
  minRating: number;
  maxRating: number;
  minYear: number;
  maxYear: number;
  genres: number[];
  sortBy: 'rating' | 'year' | 'title' | 'popularity';
  sortOrder: 'asc' | 'desc';
  minVoteCount: number;
  // Language filter - Yeni eklenen
  languages?: string[]; // ISO 639-1 language codes (tr, en, es, fr, etc.)
}

export interface CuratedContentFiltersProps {
  filters: CuratedContentFilters;
  onFiltersChange: (filters: CuratedContentFilters) => void;
  genres: Genre[];
  isOpen: boolean;
  onToggle: () => void;
  totalCount: number;
  filteredCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CuratedContentFiltersComponent: React.FC<CuratedContentFiltersProps> = ({
  filters,
  onFiltersChange,
  genres,
  isOpen,
  onToggle,
  totalCount,
  filteredCount,
  onRefresh,
  isRefreshing
}) => {
  const updateFilter = <K extends keyof CuratedContentFilters>(
    key: K,
    value: CuratedContentFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(id => id !== genreId)
      : [...filters.genres, genreId];
    updateFilter('genres', newGenres);
  };

  const clearFilters = () => {
    onFiltersChange({
      mediaType: 'all',
      minRating: 0,
      maxRating: 10,
      minYear: 1900,
      maxYear: new Date().getFullYear(),
      genres: [],
      sortBy: 'rating',
      sortOrder: 'desc',
      minVoteCount: 0,
      languages: []
    });
  };

  const activeFiltersCount = 
    (filters.mediaType !== 'all' ? 1 : 0) +
    (filters.minRating !== 0 || filters.maxRating !== 10 ? 1 : 0) +
    (filters.minYear !== 1900 || filters.maxYear !== new Date().getFullYear() ? 1 : 0) +
    filters.genres.length +
    (filters.minVoteCount !== 0 ? 1 : 0) +
    ((filters.languages || []).length > 0 ? 1 : 0);

  return (
    <div className="bg-slate-700 rounded-lg border border-slate-600 mb-6">
      {/* Filter Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-white font-medium">İçerik Filtreleri</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <span className="text-slate-400 text-sm">
            {filteredCount}/{totalCount} içerik gösteriliyor
          </span>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Get New Content Button */}
      {onRefresh && (
        <div className="px-4 pb-4 border-b border-slate-600">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-blue-500/50 disabled:to-cyan-500/50 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Yeni İçerikler Alınıyor...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Filtrelere Göre Yeni İçerikler Al</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-600 space-y-6">
          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 text-sm"
            >
              <X className="h-3 w-3" />
              <span>Tüm Filtreleri Temizle</span>
            </button>
          )}

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sıralama Kriteri
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value as CuratedContentFilters['sortBy'])}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="rating">TMDB Puanı</option>
                <option value="year">Yıl</option>
                <option value="title">Alfabetik</option>
                <option value="popularity">Popülerlik</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sıralama Yönü
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value as CuratedContentFilters['sortOrder'])}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="desc">Azalan (Yüksek → Düşük)</option>
                <option value="asc">Artan (Düşük → Yüksek)</option>
              </select>
            </div>
          </div>

          {/* Media Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İçerik Türü
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'Tümü', icon: null },
                { value: 'movie', label: 'Film', icon: Play },
                { value: 'tv', label: 'Dizi', icon: Tv }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('mediaType', option.value as CuratedContentFilters['mediaType'])}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.mediaType === option.value
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {option.icon && <option.icon className="h-3 w-3" />}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              TMDB Puan Aralığı
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min Puan</label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minRating}
                    onChange={(e) => updateFilter('minRating', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Puan</label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.maxRating}
                    onChange={(e) => updateFilter('maxRating', parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Yıl Aralığı
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Başlangıç</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={filters.minYear}
                    onChange={(e) => updateFilter('minYear', parseInt(e.target.value) || 1900)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bitiş</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={filters.maxYear}
                    onChange={(e) => updateFilter('maxYear', parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vote Count Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Minimum Oy Sayısı
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="number"
                min="0"
                value={filters.minVoteCount}
                onChange={(e) => updateFilter('minVoteCount', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Minimum oy sayısı (popülerlik için)"
              />
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İçerik Dili ({(filters.languages || []).length} seçili)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {[
                { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                { code: 'en', name: 'İngilizce', flag: '🇺🇸' },
                { code: 'es', name: 'İspanyolca', flag: '🇪🇸' },
                { code: 'fr', name: 'Fransızca', flag: '🇫🇷' },
                { code: 'de', name: 'Almanca', flag: '🇩🇪' },
                { code: 'it', name: 'İtalyanca', flag: '🇮🇹' },
                { code: 'pt', name: 'Portekizce', flag: '🇵🇹' },
                { code: 'ru', name: 'Rusça', flag: '🇷🇺' },
                { code: 'ja', name: 'Japonca', flag: '🇯🇵' },
                { code: 'ko', name: 'Korece', flag: '🇰🇷' },
                { code: 'zh', name: 'Çince', flag: '🇨🇳' },
                { code: 'ar', name: 'Arapça', flag: '🇸🇦' },
                { code: 'hi', name: 'Hintçe', flag: '🇮🇳' },
                { code: 'fa', name: 'Farsça', flag: '🇮🇷' },
                { code: 'nl', name: 'Hollandaca', flag: '🇳🇱' },
                { code: 'sv', name: 'İsveççe', flag: '🇸🇪' },
                { code: 'no', name: 'Norveççe', flag: '🇳🇴' },
                { code: 'da', name: 'Danca', flag: '🇩🇰' },
                { code: 'fi', name: 'Fince', flag: '🇫🇮' },
                { code: 'pl', name: 'Lehçe', flag: '🇵🇱' },
                { code: 'cs', name: 'Çekçe', flag: '🇨🇿' }
              ].map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    const currentLanguages = filters.languages || [];
                    const newLanguages = currentLanguages.includes(language.code)
                      ? currentLanguages.filter(lang => lang !== language.code)
                      : [...currentLanguages, language.code];
                    updateFilter('languages', newLanguages);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    (filters.languages || []).includes(language.code)
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genres Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Türler ({filters.genres.length} seçili)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {genres.slice(0, 20).map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    filters.genres.includes(genre.id)
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Summary */}
          <div className="bg-slate-600 rounded-lg p-3">
            <div className="text-sm text-slate-300">
              <strong>{filteredCount}</strong> içerik gösteriliyor 
              (toplam <strong>{totalCount}</strong> içerikten)
            </div>
            {activeFiltersCount > 0 && (
              <div className="text-xs text-slate-400 mt-1">
                {activeFiltersCount} filtre aktif
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};