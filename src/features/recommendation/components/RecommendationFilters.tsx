import React, { useMemo, useCallback } from 'react';
import { Filter, X, Star, Calendar, Play, Tv, RefreshCw, Zap } from 'lucide-react';
import type { Genre } from '../types';

interface RecommendationFiltersProps {
  filters: {
    genres: number[];
    minYear: number;
    maxYear: number;
    minRating: number;
    maxRating: number;
    mediaType: 'all' | 'movie' | 'tv';
    sortBy: 'match_score' | 'rating' | 'year' | 'title';
    minMatchScore: number;
    languages?: string[]; // Yeni eklenen dil filtresi
  };
  genres: Genre[];
  onFiltersChange: (filters: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalRecommendations: number;
  filteredCount: number;
}

const LANGUAGE_OPTIONS = [
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
  { code: 'cs', name: 'Çekçe', flag: '🇨🇿' },
  { code: 'el', name: 'Yunanca', flag: '🇬🇷' },
  { code: 'uk', name: 'Ukraynaca', flag: '🇺🇦' },
  { code: 'bg', name: 'Bulgarca', flag: '🇧🇬' },
  { code: 'ro', name: 'Rumence', flag: '🇷🇴' },
  { code: 'hu', name: 'Macarca', flag: '🇭🇺' },
  { code: 'th', name: 'Tayca', flag: '🇹🇭' },
  { code: 'id', name: 'Endonezce', flag: '🇮🇩' },
  { code: 'ms', name: 'Malayca', flag: '🇲🇾' },
  { code: 'vi', name: 'Vietnamca', flag: '🇻🇳' },
  { code: 'he', name: 'İbranice', flag: '🇮🇱' },
  { code: 'sr', name: 'Sırpça', flag: '🇷🇸' },
  { code: 'hr', name: 'Hırvatça', flag: '🇭🇷' },
  { code: 'sk', name: 'Slovakça', flag: '🇸🇰' },
  { code: 'lt', name: 'Litvanca', flag: '🇱🇹' },
  { code: 'lv', name: 'Letonca', flag: '🇱🇻' },
  { code: 'et', name: 'Estonca', flag: '🇪🇪' },
  { code: 'sl', name: 'Slovence', flag: '🇸🇮' },
  { code: 'az', name: 'Azerice', flag: '🇦🇿' },
  { code: 'ka', name: 'Gürcüce', flag: '🇬🇪' },
  { code: 'uz', name: 'Özbekçe', flag: '🇺🇿' },
  { code: 'kk', name: 'Kazakça', flag: '🇰🇿' },
  { code: 'mn', name: 'Moğolca', flag: '🇲🇳' },
  { code: 'ta', name: 'Tamilce', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengalce', flag: '🇧🇩' },
  { code: 'pa', name: 'Pencapça', flag: '🇮🇳' },
  { code: 'ur', name: 'Urduca', flag: '🇵🇰' },
  { code: 'sw', name: 'Svahili', flag: '🇰🇪' },
  { code: 'af', name: 'Afrikanca', flag: '🇿🇦' },
  { code: 'zu', name: 'Zuluca', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'st', name: 'Sotho', flag: '🇱🇸' },
  { code: 'so', name: 'Somalice', flag: '🇸🇴' },
  { code: 'am', name: 'Amharca', flag: '🇪🇹' },
  { code: 'om', name: 'Oromo', flag: '🇪🇹' },
  { code: 'ti', name: 'Tigrinya', flag: '🇪🇷' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'rn', name: 'Kirundi', flag: '🇧🇮' },
  { code: 'ny', name: 'Çiçeva', flag: '🇲🇼' },
  { code: 'mg', name: 'Malgaşça', flag: '🇲🇬' },
  { code: 'ts', name: 'Tsonga', flag: '🇿🇦' },
  { code: 'tn', name: 'Setsvana', flag: '🇧🇼' },
  { code: 've', name: 'Venda', flag: '🇿🇦' },
  { code: 'ss', name: 'Sisvati', flag: '🇸🇿' },
  { code: 'nr', name: 'Güney Ndebele', flag: '🇿🇦' },
  { code: 'nd', name: 'Kuzey Ndebele', flag: '🇿🇦' }
];

export const RecommendationFilters: React.FC<RecommendationFiltersProps> = React.memo(({
  filters,
  genres,
  onFiltersChange,
  isOpen,
  onToggle,
  onRefresh,
  isRefreshing,
  totalRecommendations,
  filteredCount
}) => {
  const updateFilter = useCallback((key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleGenre = useCallback((genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(id => id !== genreId)
      : [...filters.genres, genreId];
    updateFilter('genres', newGenres);
  }, [filters.genres, updateFilter]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      genres: [],
      minYear: 1950,
      maxYear: new Date().getFullYear(),
      minRating: 0,
      maxRating: 10,
      mediaType: 'all',
      sortBy: 'match_score',
      minMatchScore: 0,
      languages: []
    });
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(() => 
    filters.genres.length + 
    (filters.mediaType !== 'all' ? 1 : 0) + 
    (filters.minYear !== 1950 || filters.maxYear !== new Date().getFullYear() ? 1 : 0) +
    (filters.minRating !== 0 || filters.maxRating !== 10 ? 1 : 0) +
    (filters.minMatchScore !== 0 ? 1 : 0) +
    ((filters.languages || []).length > 0 ? 1 : 0), [filters]);

  // Popüler türleri önce göster
  const sortedGenres = useMemo(() => [...genres].sort((a, b) => {
    const popularGenres = [28, 35, 18, 878, 27, 10749, 53, 16, 80, 12, 14, 10765]; // Popüler tür ID'leri
    const aIndex = popularGenres.indexOf(a.id);
    const bIndex = popularGenres.indexOf(b.id);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name, 'tr');
  }), [genres]);

  const [showOtherLanguages, setShowOtherLanguages] = React.useState(false);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 hover:bg-slate-700 transition-colors rounded-lg px-2 py-1"
        >
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-white font-medium">Öneri Filtreleri</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <span className="text-slate-400 text-sm">
            {activeFiltersCount > 0 ? `${activeFiltersCount} filtre aktif` : 'Tüm öneriler'}
          </span>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-600/50 disabled:to-pink-600/50 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Yenileniyor...' : 'Filtrelere Göre Yeni Öneriler'}</span>
        </button>
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-700 space-y-6">
          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 text-sm"
            >
              <X className="h-3 w-3" />
              <span>Filtreleri Temizle ve Tüm Önerileri Getir</span>
            </button>
          )}

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sıralama (Yeni Önerilerde)
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="match_score">Eşleşme Oranı (Yüksek → Düşük)</option>
              <option value="rating">TMDB Puanı (Yüksek → Düşük)</option>
              <option value="year">Yıl (Yeni → Eski)</option>
              <option value="title">Alfabetik (A → Z)</option>
            </select>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İçerik Türü (Yeni Önerilerde)
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'Tümü', icon: null },
                { value: 'movie', label: 'Film', icon: Play },
                { value: 'tv', label: 'Dizi', icon: Tv }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('mediaType', option.value)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.mediaType === option.value
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {option.icon && <option.icon className="h-3 w-3" />}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Match Score Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Minimum Eşleşme Oranı (Yeni Önerilerde)
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minMatchScore}
                  onChange={(e) => updateFilter('minMatchScore', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>%0</span>
                <span className="text-amber-400 font-medium">%{filters.minMatchScore}</span>
                <span>%100</span>
              </div>
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Yıl Aralığı (Yeni Önerilerde)
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
                    onChange={(e) => updateFilter('minYear', parseInt(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    onChange={(e) => updateFilter('maxYear', parseInt(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rating Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              TMDB Puan Aralığı (Yeni Önerilerde)
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
                    onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    onChange={(e) => updateFilter('maxRating', parseFloat(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İçerik Dili (Yeni Önerilerde) ({(filters.languages || []).length} seçili)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {LANGUAGE_OPTIONS.slice(0, 20).map(language => (
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
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
              {/* Diğer... butonu */}
              <button
                onClick={() => setShowOtherLanguages(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-slate-600 text-slate-300 hover:bg-slate-500"
              >
                <span className="text-base">➕</span>
                <span>Diğer...</span>
              </button>
            </div>
            {/* Diğer diller açılır menüsü */}
            {showOtherLanguages && (
              <div className="mt-2">
                <select
                  className="w-full bg-slate-700 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onChange={e => {
                    const code = e.target.value;
                    if (code) {
                      const currentLanguages = filters.languages || [];
                      if (!currentLanguages.includes(code)) {
                        updateFilter('languages', [...currentLanguages, code]);
                      }
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Dil seçin...</option>
                  {LANGUAGE_OPTIONS.slice(20).map(language => (
                    <option key={language.code} value={language.code}>
                      {language.flag} {language.name} ({language.code})
                    </option>
                  ))}
                </select>
                <button
                  className="mt-2 text-xs text-slate-400 hover:text-white"
                  onClick={() => setShowOtherLanguages(false)}
                >Kapat</button>
              </div>
            )}
          </div>

          {/* Genres - GELİŞTİRİLDİ */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Türler (Yeni Önerilerde) ({filters.genres.length} seçili)
            </label>
            
            {/* Popüler türler için hızlı seçim */}
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">Popüler Türler:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 28, name: 'Aksiyon' },
                  { id: 35, name: 'Komedi' },
                  { id: 18, name: 'Dram' },
                  { id: 878, name: 'Bilim Kurgu' },
                  { id: 10765, name: 'Bilim Kurgu & Fantazi' },
                  { id: 27, name: 'Korku' },
                  { id: 10749, name: 'Romantik' },
                  { id: 53, name: 'Gerilim' }
                ].map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
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

            {/* Diğer türler (popüler türler hariç) */}
            <div className="mb-2">
              <p className="text-xs text-slate-400 mb-2">Diğer Türler:</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {sortedGenres.filter(genre => ![28, 35, 18, 878, 10765, 27, 10749, 53].includes(genre.id)).map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    filters.genres.includes(genre.id)
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtreleme İpuçları */}
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-300 mb-2 font-medium">💡 Filtreleme İpuçları:</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Eşleşme oranı: Profilinle ne kadar uyumlu olduğunu gösterir</li>
              <li>• Birden fazla tür seçerek daha spesifik sonuçlar alabilirsin</li>
              <li>• "Bilim Kurgu & Fantazi" türü diziler için özel olarak tasarlandı</li>
              <li>• Minimum puan ayarlayarak kaliteyi kontrol edebilirsin</li>
              <li>• Yıl aralığı ile dönem tercihi belirleyebilirsin</li>
            </ul>
          </div>

          {/* Filter Summary */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="text-sm text-slate-300">
              <strong>{filteredCount}</strong> öneri gösteriliyor 
              (toplam <strong>{totalRecommendations}</strong> öneriden)
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
});